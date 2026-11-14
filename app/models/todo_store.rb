require "monitor"
require "json"
require "fileutils"
require "date"

module TodoStore
  extend self

  @lock = Monitor.new
  @path = ENV.fetch("TODO_DATA_PATH", Rails.root.join("tmp/todos.json").to_s)

  def workspace
    @lock.synchronize do
      data = deep_copy(@state)
      children_by_parent = data[:tasks].group_by { |task| task[:parent_id] }
      data[:tasks].each do |task|
        children = children_by_parent[task[:id]] || []
        task[:progress] = children.empty? ? task[:progress].to_i : average_progress(children)
      end
      leaves = data[:tasks].select { |task| task[:parent_id] || children_by_parent[task[:id]].blank? }
      data[:progress] = average_progress(leaves)
      data[:completed_tasks] = leaves.count { |task| task[:progress].to_i >= 100 }
      data[:total_tasks] = leaves.length
      data
    end
  end

  def update_goal(attributes)
    @lock.synchronize do
      attributes.each do |key, value|
        next unless %i[title description start_date target_date].include?(key.to_sym)

        clean_value = value.to_s.strip.presence
        @state[:goal][key.to_sym] = if %i[start_date target_date].include?(key.to_sym)
          normalize_date(clean_value)
        else
          clean_value
        end
      end
      raise ArgumentError, "目標名を入力してください" if @state[:goal][:title].blank?

      persist
      deep_copy(@state[:goal])
    end
  end

  def create_task(title, parent_id: nil, due_date: nil, tag: nil)
    @lock.synchronize do
      clean_title = title.to_s.strip
      raise ArgumentError, "課題名を入力してください" if clean_title.blank?

      parent = parent_id.present? ? find_task!(parent_id) : nil
      raise ArgumentError, "子課題の下にさらに課題は追加できません" if parent&.dig(:parent_id).present?

      task = {
        id: @state[:next_id], title: clean_title, parent_id: parent&.dig(:id),
        due_date: normalize_date(due_date), progress: 0, tag: normalize_tag(tag)
      }
      @state[:next_id] += 1
      @state[:tasks] << task
      persist
      deep_copy(task)
    end
  end

  def update_task(id, attributes)
    @lock.synchronize do
      task = find_task!(id)
      task[:title] = attributes[:title].to_s.strip if attributes.key?(:title)
      raise ArgumentError, "課題名を入力してください" if task[:title].blank?
      task[:due_date] = normalize_date(attributes[:due_date]) if attributes.key?(:due_date)
      task[:tag] = normalize_tag(attributes[:tag]) if attributes.key?(:tag)
      if attributes.key?(:progress) && !@state[:tasks].any? { |item| item[:parent_id] == task[:id] }
        task[:progress] = [[attributes[:progress].to_i, 0].max, 100].min
      end
      persist
      deep_copy(task)
    end
  end

  def delete_task(id)
    @lock.synchronize do
      task = find_task!(id)
      ids = [task[:id]]
      ids.concat(@state[:tasks].select { |item| item[:parent_id] == task[:id] }.map { |item| item[:id] })
      @state[:tasks].reject! { |item| ids.include?(item[:id]) }
      persist
    end
  end

  def save_daily_entry(date, done: nil, not_done: nil, activities: nil)
    @lock.synchronize do
      date_key = Date.iso8601(date.to_s).iso8601
      previous = @state[:daily_entries].find { |item| item[:date] == date_key } || {}
      entry = {
        date: date_key,
        done: done.nil? ? previous[:done].to_s : done.to_s.strip,
        not_done: not_done.nil? ? previous[:not_done].to_s : not_done.to_s.strip,
        activities: activities.nil? ? (previous[:activities] || []) : normalize_activities(activities)
      }
      @state[:daily_entries].reject! { |item| item[:date] == date_key }
      @state[:daily_entries] << entry
      @state[:daily_entries].sort_by! { |item| item[:date] }

      leaves = task_leaves
      progress = average_progress(leaves)
      @state[:progress_history].reject! { |item| item[:date] == date_key }
      @state[:progress_history] << { date: date_key, progress: progress }
      @state[:progress_history].sort_by! { |item| item[:date] }
      persist
      deep_copy(entry.merge(progress: progress))
    rescue Date::Error
      raise ArgumentError, "日付を正しく入力してください"
    end
  end

  # Compatibility for the original simple todo endpoints.
  def all
    workspace[:tasks].map { |task| task.merge(completed: task[:progress].to_i >= 100) }
  end

  def create(title)
    create_task(title).merge(completed: false)
  end

  def update(id, completed:)
    task = find_task!(id)
    update_task(id, progress: ActiveModel::Type::Boolean.new.cast(completed) ? 100 : 0).merge(completed: !completed.nil? && ActiveModel::Type::Boolean.new.cast(completed))
  rescue ArgumentError
    nil
  end

  def delete(id)
    delete_task(id)
    true
  rescue ArgumentError
    false
  end

  private

  def default_state
    {
      goal: { title: "新しい目標", description: "目標に向かう理由や、達成したいことを書きましょう。", start_date: Date.current.iso8601, target_date: nil },
      tasks: [], daily_entries: [], progress_history: [], next_id: 1
    }
  end

  def load_state
    data = JSON.parse(File.read(@path), symbolize_names: true)
    if data.key?(:todos) && !data.key?(:tasks)
      migrated_tasks = data[:todos].map do |todo|
        { id: todo[:id], title: todo[:title], parent_id: nil, due_date: nil, progress: todo[:completed] ? 100 : 0 }
      end
      next_id = data[:next_id] || (migrated_tasks.map { |task| task[:id].to_i }.max || 0) + 1
      data = default_state.merge(tasks: migrated_tasks, next_id: next_id)
    end
    defaults = default_state
    defaults.merge(data).tap do |state|
      state[:goal] = defaults[:goal].merge(state[:goal] || {})
      state[:tasks] ||= []
      state[:daily_entries] ||= []
      state[:progress_history] ||= []
      state[:next_id] ||= (state[:tasks].map { |task| task[:id].to_i }.max || 0) + 1
    end
  rescue Errno::ENOENT, JSON::ParserError, KeyError
    default_state
  end

  def find_task!(id)
    @state[:tasks].find { |task| task[:id] == id.to_i } || raise(ArgumentError, "課題が見つかりません")
  end

  def task_leaves
    @state[:tasks].select do |task|
      task[:parent_id].present? || !@state[:tasks].any? { |child| child[:parent_id] == task[:id] }
    end
  end

  def average_progress(tasks)
    return 0 if tasks.empty?

    (tasks.sum { |task| task[:progress].to_i } / tasks.length.to_f).round
  end

  def normalize_date(value)
    return nil if value.blank?

    Date.iso8601(value.to_s).iso8601
  rescue Date::Error
    raise ArgumentError, "日付を正しく入力してください"
  end

  def normalize_tag(value)
    clean_tag = value.to_s.strip
    raise ArgumentError, "タグは20文字以内で入力してください" if clean_tag.length > 20

    clean_tag.presence
  end

  def normalize_activities(activities)
    Array(activities).filter_map do |activity|
      attributes = activity.to_h.symbolize_keys
      content = attributes[:content].to_s.strip
      next if content.blank?

      task_id = attributes[:task_id].presence&.to_i
      task = task_id && @state[:tasks].find { |item| item[:id] == task_id }
      task_title = task&.dig(:title) || attributes[:task_title].to_s.strip
      raise ArgumentError, "課題を選択してください" if task_title.blank?
      raise ArgumentError, "記録は4000文字以内で入力してください" if content.length > 4000

      { task_id: task_id, task_title: task_title, content: content }
    end
  end

  def deep_copy(value)
    Marshal.load(Marshal.dump(value))
  end

  def persist
    FileUtils.mkdir_p(File.dirname(@path))
    temporary_path = "#{@path}.tmp"
    File.write(temporary_path, JSON.generate(@state))
    File.rename(temporary_path, @path)
  end

  @state = load_state
end
