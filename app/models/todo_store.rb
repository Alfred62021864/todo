require "monitor"
require "json"
require "fileutils"

module TodoStore
  extend self

  @lock = Monitor.new
  @path = ENV.fetch("TODO_DATA_PATH", Rails.root.join("tmp/todos.json").to_s)

  def all
    @lock.synchronize { @todos.map(&:dup) }
  end

  def create(title)
    @lock.synchronize do
      todo = { id: @next_id, title: title, completed: false }
      @next_id += 1
      @todos << todo
      persist
      todo.dup
    end
  end

  def update(id, completed:)
    @lock.synchronize do
      todo = @todos.find { |item| item[:id] == id.to_i }
      if todo && !completed.nil?
        todo[:completed] = ActiveModel::Type::Boolean.new.cast(completed)
        persist
      end
      todo&.dup
    end
  end

  def delete(id)
    @lock.synchronize do
      index = @todos.index { |todo| todo[:id] == id.to_i }
      return false if index.nil?

      @todos.delete_at(index)
      persist
      true
    end
  end

  private

  def load_data
    data = JSON.parse(File.read(@path), symbolize_names: true)
    [data.fetch(:todos), data.fetch(:next_id)]
  rescue Errno::ENOENT, JSON::ParserError, KeyError
    [[], 1]
  end

  def persist
    FileUtils.mkdir_p(File.dirname(@path))
    temporary_path = "#{@path}.tmp"
    File.write(temporary_path, JSON.generate(todos: @todos, next_id: @next_id))
    File.rename(temporary_path, @path)
  end

  @todos, @next_id = load_data
end
