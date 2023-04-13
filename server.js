const http = require("http");
const express = require("express");
const yup = require("yup");
const mongoose = require("mongoose");
const { Schema } = mongoose;

mongoose
  .connect('mongodb://localhost:27017/fm_mongoose')
  .catch((error) => console.log(error));

const emailSchema = yup.string().trim().email().required();

const taskSchema = new Schema(
  {

    content: {
      type: String,
      required: true,
      validate: {
        validator: (v) => /[A-Z0-9][\w\s]{5,100}/.test(v),
        message: (props) => `${props.value} is not a valid content!`,
      }
    },

    isDone: { type: Boolean, default: false },

    createdAt: { type: Date, default: Date.now },

    owner: {
      name: {
        type: String,
        validate: {
          validator: (v) => v !== '',
          message: (props) => `${props.value} is not a valid name!`,
        }
      },
      age: {
        type: Number,
        validate: {
          validator: (v) => v > 0 && v < 150,
          message: (props) => `${props.value} is not a valid age!`,
        }
      },
      email: {
        type: String,
        required: true,
        validate: {
          validator: (v) => emailSchema.isValidSync(v),
        },
      }
    },

    // comments: [{ type: Schema.Types.ObjectId, ref: 'Comment' }],
  },
  {
    versionKey: false,
    timestamps: true
  }
);

const commentSchema = new Schema({
  bodyComment: {
    type: String,
    required: true
  },
  task: {
    type: Schema.Types.ObjectId,
    ref: 'Task'
  },

},
  {
    versionKey: false,
    timestamps: true
  }
);

const Task = mongoose.model('Task', taskSchema);
const Comment = mongoose.model('Comment', commentSchema);

const app = express();

app.use(express.json());



app.get('/tasks', async (req, res, next) => {
  try {
    const tasks = await Task.find({});
    res.status(200).send({ data: tasks })
  } catch (error) {
    next(error);
  }
});

app.get('/tasks/:taskId', async (req, res, next) => {
  try {
    const { params: { taskId } } = req;
    // const task = await Task.findById(taskId);
    // const task = await Comment.populate(await Comment.find({ task: taskId }), { path: 'task' });
    const task = await Comment.populate(await Comment.find({task:taskId}), {path: 'task', select:['content', 'owner']});
    res.status(200).send({ data: task });
  } catch (error) {
    next(error);
  }
});


app.post('/tasks', async (req, res, next) => {
  try {
    const { body } = req;
    const newTask = await Task.create(body);
    res.status(201).send({ data: newTask })
  } catch (error) {
    next(error);
  }
});


app.delete('/tasks/:taskId', async (req, res, next) => {
  try {
    const { params: { taskId } } = req;
    console.log(taskId);
    const task = await Task.findByIdAndDelete(taskId);
    res.status(200).send({ data: task })
  } catch (error) {
    next(error);
  }
});
app.patch('/tasks/:taskId', async (req, res, next) => {
  try {
    const { params: { taskId }, body } = req;
    const updateTask = await Task.findByIdAndUpdate(taskId, body, { new: true });
    res.status(200).send({ data: updateTask })
  } catch (error) {
    next(error);
  }
});




app.post('/tasks/:idTask/comments', async (req, res, next) => {
  try {
    const { body, params: { idTask } } = req;
    const comment = await Comment.create({ ...body, task: idTask });
    res.status(201).send({ data: comment });
  } catch (error) {
    next(error);
  }
});

app.get('/comments', async (req, res, next) => {
  try {
    const comments = await Comment
      .find()
      .populate('task');
    res.status(200).send({ data: comments });

  } catch (error) {
    next(error);
  }
});



const server = http.createServer(app);
const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log("server started at port: " + port);
});