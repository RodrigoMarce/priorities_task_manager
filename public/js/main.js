// FRONT-END (CLIENT) JAVASCRIPT HERE

const submit = async function( event ) {
    // stop form submission from trying to load
    // a new .html page for displaying results...
    // this was the original browser behavior and still
    // remains to this day
    event.preventDefault()

    const taskNameInput = document.querySelector( "#taskname" );
    const dueDateInput = document.querySelector( "#duedate" );
    const priorityInput = document.querySelector( "#priority" );
    const descriptionInput = document.querySelector( "#description" );

    const json = {
        taskname: taskNameInput.value,
        duedate: dueDateInput.value,
        priority: priorityInput.value,
        description: descriptionInput.value
    };

    const body = JSON.stringify( json )

    try {
        const response = await fetch("/tasks", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body
        });

        if (response.ok) {
            const newTask = await response.json();
            addTask(newTask);
            clearForm();
        } else {
            console.error("Failed to submit task");
        }
    } catch (error) {
        console.error("Error submitting task:", error);
    }
}

function addTask(task) {
    const taskList = document.querySelector("#task-list");
    const li = document.createElement("li");

    const priority = calculatePriority(task);

    li.innerHTML = `Priority Score: ${priority}<br> <b class="taskname">${task.taskname}</b><br> <b>Due:</b> ${task.duedate}<br> <b>Priority:</b> ${task.priority}<br> <b>Description:</b> ${task.description}<br>`;
    li.dataset.taskId = task._id;

    const removeButton = document.createElement("button");
    removeButton.textContent = "Remove";
    removeButton.classList.add(
        "bg-blue-800",
        "hover:bg-blue-900",
        "text-white",
        "font-bold",
        "py-2",
        "px-4",
        "rounded",
        "focus:outline-none",
        "focus:shadow-outline"
    );
    removeButton.onclick = function() {
        deleteTask(task._id);
        li.remove();
    };

    const editButton = document.createElement("button");
    editButton.textContent = "Edit";
    editButton.classList.add(
        "bg-blue-800",
        "hover:bg-blue-900",
        "text-white",
        "font-bold",
        "py-2",
        "px-4",
        "rounded",
        "focus:outline-none",
        "focus:shadow-outline",
        "m-3"
    );
    editButton.onclick = function() {
        document.querySelector("#taskname").value = task.taskname;
        document.querySelector("#duedate").value = task.duedate;
        document.querySelector("#priority").value = task.priority;
        document.querySelector("#description").value = task.description;
        deleteTask(task._id);
        li.remove();
    }

    li.appendChild(removeButton);
    li.appendChild(editButton);
    taskList.appendChild(li);
    sortTasks();
}

function calculatePriority(task) {
    const priorityValues = { high: 16, medium: 13, low: 10 };
    const priority = priorityValues[task.priority];
    const daysUntilDue = Math.ceil((new Date(task.duedate) - new Date()) / (1000 * 60 * 60 * 24))
    return priority - daysUntilDue;
}

function sortTasks() {
    const taskList = document.querySelector("#task-list");
    const tasks = Array.from(taskList.children);

    tasks.sort((a, b) => {
        const scoreA = parseInt(a.firstChild.textContent.split(': ')[1]);
        const scoreB = parseInt(b.firstChild.textContent.split(': ')[1]);
        return scoreB - scoreA;
    });

    taskList.innerHTML = '';
    tasks.forEach(task => taskList.appendChild(task));
}

function clearForm() {
    document.querySelector("#taskname").value = "Add a task here";
    document.querySelector("#duedate").value = "";
    document.querySelector("#priority").value = "High";
    document.querySelector("#description").value = "";
}

async function deleteTask(taskId) {
    try {
        const response = await fetch(`/tasks/${taskId}`, {
            method: 'DELETE'
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Failed to delete task: ${errorData.message || response.statusText}`);
        }
        console.log(`Task ${taskId} deleted successfully`);
    } catch (error) {
        console.error("Error deleting task:", error.message);
    }
}

window.onload = async function() {
    const button = document.querySelector("button");
    button.onclick = submit;
    const content = document.querySelector("#list");
    try {
        const response = await fetch('/auth/status');
        if (response.ok) {
            const {authenticated} = await response.json();
            if (authenticated) {
                await loadTasks(content);
            } else {
                displayLoginButton(content);
            }
        } else {
            console.error("Failed to check authentication status");
            displayLoginButton(content);
        }
    } catch (error) {
        console.error("Error checking authentication status:", error);
        displayLoginButton(content);
    }
    await displayUsername();
}

function displayLoginButton(container) {
    container.innerHTML = container.innerHTML = `
  <button id="github-login" class="w-full bg-blue-800 hover:bg-blue-900 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline border-2 border-white">
    Log in through GitHub
  </button>
`;
    document.querySelector("#github-login").onclick = () => {
        window.location.href = '/auth/github';
    };
}

async function loadTasks(container) {
    container.innerHTML = '<ul id="task-list"></ul>';
    try {
        const response = await fetch('/tasks');
        if (response.ok) {
            const tasks = await response.json();
            tasks.forEach(addTask);
        } else {
            console.error("Failed to load tasks");
        }
    } catch (error) {
        console.error("Error loading tasks:", error);
    }
}

async function displayUsername() {
    try {
        const response = await fetch('/api/user');
        if (response.ok) {
            const data = await response.json();
            const usernameElement = document.getElementById('username');
            if (usernameElement) {
                usernameElement.textContent = `Hello, ${data.username}`;
            }
        } else {
            console.log('User not authenticated');
        }
    } catch (error) {
        console.error('Error fetching user data:', error);
    }
}
