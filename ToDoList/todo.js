

async function addTodo(){
    const todoInput = document.getElementById('todo-input');
    const user = auth.currentUser;
    const content = todoInput.value;

    if(user){
        const userDocument = await db.collection("Users").doc(user.uid).get();
        const username = userDocument.data()

        try{

            if(content.trim() === ''){
                alert("Please enter a task.");
                return;
            }

            await db.collection("Todo").add({
                userId: user.uid,
                username: username?.name,
                todoText: content,
                completed: false,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            todoInput.value = '';
            loadTodos();

        }catch(error){
            console.error("Error adding todo: ", error);
        }
    }
}

async function loadTodos(){
    const user = auth.currentUser;
    console.log("loadTodos called, user:", user);
    
    const listContainer = document.querySelector('.todo-items');
    if(!listContainer) {
        console.error("Todo items container not found!");
        return;
    }
    listContainer.innerHTML = '';
    
    if(!user){
        console.log("No user logged in");
        return;
    }
    
    try{
        const todos = await db.collection("Todo")
            .where("userId", "==", user.uid)
            .orderBy("createdAt", "desc")
            .get();

        console.log("Found todos:", todos.size);

        // Display each todo item
        todos.forEach((doc) => {
            const todo = doc.data();
            console.log("Todo item:", todo);
            const todoItemDiv = document.createElement('div');
            // Set class and inner HTML for the todo item
            todoItemDiv.className = 'todo-item';
            todoItemDiv.innerHTML = `
                <input type="checkbox" ${todo.completed ? 'checked' : ''} onchange="toggleTodoCompletion('${doc.id}', this.checked)">
                <span class="${todo.completed ? 'completed' : ''}">${todo.todoText}</span>
                <button onclick="deleteWithConfirm('${doc.id}')">Delete</button>
                <button onclick="editTodo('${doc.id}', prompt('Edit your task:', '${todo.todoText}'))">Edit</button>
            `;
            listContainer.appendChild(todoItemDiv);
        });
    }catch(error){
        console.error("Error loading todos:", error);
    }
}

async function toggleTodoCompletion(todoId, isCompleted){
    try{
        await db.collection("Todo").doc(todoId).update({
            completed: isCompleted
        });
        loadTodos();
    }catch(error){
        console.error("Error updating todo: ", error);
    }
}

async function deleteWithConfirm(todoId){
    if(confirm("Are you sure you want to delete this task?")){
        await deleteTodo(todoId);
    }else{
        console.log("Delete cancelled");
    }
}

async function deleteTodo(todoId){
    try{
        await db.collection("Todo").doc(todoId).delete();
        loadTodos();
    }catch(error){
        console.error("Error deleting todo: ", error);
    }
}

async function editTodo(todoId, newText){
    try{
        await db.collection("Todo").doc(todoId).update({
            todoText: newText
        });
        loadTodos();
    }catch(error){
        console.error("Error editing todo: ", error);
    }
}

auth.onAuthStateChanged((user) => {
    if(user){
        loadTodos();
    }
});

