class GoalsController < ApplicationController
  def update
    render json: TodoStore.update_goal(goal_params)
  rescue ArgumentError => error
    render json: { error: error.message }, status: :unprocessable_entity
  end

  private

  def goal_params
    params.require(:goal).permit(:title, :description, :start_date, :target_date).to_h.symbolize_keys
  end
end
