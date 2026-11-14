class DailyEntriesController < ApplicationController
  def upsert
    entry = TodoStore.save_daily_entry(
      params[:date],
      done: daily_entry_params[:done],
      not_done: daily_entry_params[:not_done],
      activities: daily_entry_params[:activities]
    )
    render json: entry
  rescue ArgumentError => error
    render json: { error: error.message }, status: :unprocessable_entity
  end

  private

  def daily_entry_params
    params.require(:daily_entry).permit(:done, :not_done, activities: %i[task_id task_title content])
  end
end
