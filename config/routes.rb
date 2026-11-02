Rails.application.routes.draw do
  get "/api/health", to: proc { [200, { "Content-Type" => "application/json" }, ['{"status":"ok","message":"Rails API is working"}']] }

  resources :todos, only: %i[index create update destroy], defaults: { format: :json }, path: "/api/todos"
end
