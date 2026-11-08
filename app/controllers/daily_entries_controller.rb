class DailyEntriesController < ApplicationController
  def upsert
    entry = TodoStore.save_daily_entry(
      params[:date],
      done: daily_entry_params[:done],
      not_done: daily_entry_params[:not_done]
    )
    render json: entry
  rescue ArgumentError => error
    render json: { error: error.message }, status: :unprocessable_entity
  end

  private

  def daily_entry_params
    params.require(:daily_entry).permit(:done, :not_done)
  end
end
