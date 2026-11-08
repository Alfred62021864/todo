class TasksController < ApplicationController
  def create
    task = TodoStore.create_task(task_params.require(:title), parent_id: task_params[:parent_id], due_date: task_params[:due_date])
    render json: task, status: :created
  rescue ArgumentError => error
    render json: { error: error.message }, status: :unprocessable_entity
  end

  def update
    render json: TodoStore.update_task(params[:id], task_params.to_h.symbolize_keys)
  rescue ArgumentError => error
    render json: { error: error.message }, status: :unprocessable_entity
  end

  def destroy
    TodoStore.delete_task(params[:id])
    head :no_content
  rescue ArgumentError => error
    render json: { error: error.message }, status: :not_found
  end

  private

  def task_params
    params.require(:task).permit(:title, :parent_id, :due_date, :progress)
  end
end
