class DailyPlansController < ApplicationController
  def upsert
    plan = TodoStore.save_daily_plan(params[:date], task_ids: daily_plan_params[:task_ids], completed_task_ids: daily_plan_params[:completed_task_ids])
    render json: plan
  rescue ArgumentError => error
    render json: { error: error.message }, status: :unprocessable_entity
  end

  private

  def daily_plan_params
    params.require(:daily_plan).permit(task_ids: [], completed_task_ids: [])
  end
end
