
const express = require("express");
const { MongoClient, ObjectId } = require("mongodb");
const dotenv = require("dotenv");
const path = require("path");
const cors = require("cors");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
    origin: "https://shivaranjini-s36.github.io"
}));

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const client = new MongoClient(process.env.MONGODB_URI);
let tasksCollection;

// Display MongoDB records in terminal
async function showDatabaseRecords() {
    const tasks = await tasksCollection
        .find({})
        .sort({ createdAt: -1 })
        .toArray();

    console.log("\n========== MONGODB TASK RECORDS ==========");
    console.log("Total tasks:", tasks.length);

    if (tasks.length === 0) {
        console.log("No tasks found.");
    } else {
        console.table(tasks.map(task => ({
            ID: task._id.toString(),
            Title: task.title,
            Description: task.description,
            DueDate: task.dueDate || "Not set",
            Status: task.status
        })));
    }

    console.log("==========================================\n");
}

// Get all tasks
app.get("/api/tasks", async (req, res) => {
    try {
        const tasks = await tasksCollection
            .find({})
            .sort({ createdAt: -1 })
            .toArray();

        res.json(tasks);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Could not load tasks."
        });
    }
});

// Add a new task
app.post("/api/tasks", async (req, res) => {
    try {
        const { title, description, dueDate } = req.body;

        if (!title || !title.trim()) {
            return res.status(400).json({
                message: "Task title is required."
            });
        }

        const task = {
            title: title.trim(),
            description: (description || "").trim(),
            dueDate: dueDate || "",
            status: "Pending",
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const result = await tasksCollection.insertOne(task);

        console.log("\nNEW TASK ADDED:", task.title);

        await showDatabaseRecords();

        res.status(201).json({
            ...task,
            _id: result.insertedId
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Could not add task."
        });
    }
});

// Edit a task
app.put("/api/tasks/:id", async (req, res) => {
    try {
        const { title, description, dueDate } = req.body;
        const id = req.params.id;

        if (!ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "Invalid task ID."
            });
        }

        if (!title || !title.trim()) {
            return res.status(400).json({
                message: "Task title is required."
            });
        }

        const result = await tasksCollection.updateOne(
            { _id: new ObjectId(id) },
            {
                $set: {
                    title: title.trim(),
                    description: (description || "").trim(),
                    dueDate: dueDate || "",
                    updatedAt: new Date()
                }
            }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({
                message: "Task not found."
            });
        }

        console.log("\nTASK EDITED:", title);

        await showDatabaseRecords();

        res.json({
            message: "Task updated successfully."
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Could not edit task."
        });
    }
});

// Change task status
app.patch("/api/tasks/:id/status", async (req, res) => {
    try {
        const { status } = req.body;
        const allowedStatuses = [
            "Pending",
            "Ongoing",
            "Completed"
        ];

        if (!ObjectId.isValid(req.params.id)) {
            return res.status(400).json({
                message: "Invalid task ID."
            });
        }

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                message: "Invalid task status."
            });
        }

        const result = await tasksCollection.updateOne(
            { _id: new ObjectId(req.params.id) },
            {
                $set: {
                    status,
                    updatedAt: new Date()
                }
            }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({
                message: "Task not found."
            });
        }

        console.log("\nTASK STATUS CHANGED TO:", status);

        await showDatabaseRecords();

        res.json({
            message: "Task status updated."
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Could not update status."
        });
    }
});

// Delete a task
app.delete("/api/tasks/:id", async (req, res) => {
    try {
        if (!ObjectId.isValid(req.params.id)) {
            return res.status(400).json({
                message: "Invalid task ID."
            });
        }

        const result = await tasksCollection.deleteOne({
            _id: new ObjectId(req.params.id)
        });

        if (result.deletedCount === 0) {
            return res.status(404).json({
                message: "Task not found."
            });
        }

        console.log("\nTASK DELETED. Updated database records:");

        await showDatabaseRecords();

        res.json({
            message: "Task deleted successfully."
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Could not delete task."
        });
    }
});

// Display database records whenever requested
app.get("/api/tasks/database", async (req, res) => {
    try {
        await showDatabaseRecords();

        res.json({
            message: "Records displayed in terminal."
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Could not display records."
        });
    }
});

// Start server and connect MongoDB
async function startServer() {
    try {
        if (!process.env.MONGODB_URI) {
            throw new Error("MONGODB_URI is missing in .env");
        }

        await client.connect();

        const db = client.db("taskmanagement");
        tasksCollection = db.collection("tasks");

        console.log("MongoDB connected successfully!");
        console.log("Database: taskmanagement");
        console.log("Collection: tasks");

        await showDatabaseRecords();

        app.listen(PORT, () => {
            console.log(
                `Task Management Dashboard running at http://localhost:${PORT}`
            );
        });

    } catch (error) {
        console.error("Server startup failed:", error.message);

        await client.close().catch(() => {});

        process.exit(1);
    }
}

startServer();
