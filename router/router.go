package router

import (
	"go-postgres/middleware"
	"html/template"
	"net/http"

	"github.com/gorilla/mux"
)

// Router is exported and used in main.go
func Router() *mux.Router {

	router := mux.NewRouter()

	router.HandleFunc("/api/newuser", middleware.CreateUser).Methods("POST", "OPTIONS")
	router.HandleFunc("/api/user/login", middleware.GetUser).Methods("POST", "OPTIONS")
	router.HandleFunc("/api/user/{id}", middleware.GetUserById).Methods("PUT", "OPTIONS")
	router.HandleFunc("/api/transaction/add", middleware.AddTransaction).Methods("POST", "OPTIONS")
	router.HandleFunc("/api/transaction/get", middleware.GetTransaction).Methods("POST", "OPTIONS")
	router.HandleFunc("/api/transaction/delete", middleware.DeleteTransaction).Methods("POST", "OPTIONS")
	// ---- Unused ----
	//router.HandleFunc("/api/user", middleware.GetAllUser).Methods("GET", "OPTIONS")
	//router.HandleFunc("/api/deleteuser/{id}", middleware.DeleteUser).Methods("DELETE", "OPTIONS")

	router.HandleFunc("/", HomeHandler).Methods("GET")
	router.HandleFunc("/login.html", LoginHandler).Methods("GET")
	router.HandleFunc("/signUp.html", SignUpHandler).Methods("GET")
	router.PathPrefix("/static/").Handler(http.StripPrefix("/static/", http.FileServer(http.Dir("static"))))

	return router
}

func HomeHandler(w http.ResponseWriter, r *http.Request) {
	tmpl, err := template.ParseFiles("templates/index.html")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	tmpl.Execute(w, nil)
}

func LoginHandler(w http.ResponseWriter, r *http.Request) {
	tmpl, err := template.ParseFiles("templates/login.html")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	tmpl.Execute(w, nil)
}

func SignUpHandler(w http.ResponseWriter, r *http.Request) {
	tmpl, err := template.ParseFiles("templates/signUp.html")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	tmpl.Execute(w, nil)
}
