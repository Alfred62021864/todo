Rails.application.routes.draw do
  get "/api/health", to: proc { [200, { "Content-Type" => "application/json" }, ['{"status":"ok","message":"Rails API is working"}']] }

  get "/api/workspace", to: "workspace#show"
  patch "/api/goal", to: "goals#update"
  resources :tasks, only: %i[create update destroy], path: "/api/tasks"
  put "/api/daily_entries/:date", to: "daily_entries#upsert"

  resources :todos, only: %i[index create update destroy], defaults: { format: :json }, path: "/api/todos"
end
