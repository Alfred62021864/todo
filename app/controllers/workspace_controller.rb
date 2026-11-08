class WorkspaceController < ApplicationController
  def show
    render json: TodoStore.workspace
  end
end
