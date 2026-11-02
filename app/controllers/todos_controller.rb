class TodosController < ApplicationController
  def index
    render json: TodoStore.all
  end

  def create
    title = params.require(:title).to_s.strip
    return render json: { error: "Title can't be blank" }, status: :unprocessable_entity if title.blank?

    render json: TodoStore.create(title), status: :created
  end

  def update
    todo = TodoStore.update(params[:id], completed: params[:completed])
    return render json: { error: "Todo not found" }, status: :not_found unless todo

    render json: todo
  end

  def destroy
    return head :no_content if TodoStore.delete(params[:id])

    render json: { error: "Todo not found" }, status: :not_found
  end
end
