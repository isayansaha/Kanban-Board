import { useState, useEffect } from 'react';
import { 
  DndContext, 
  DragOverlay, 
  closestCorners, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  useDroppable
} from '@dnd-kit/core';
import { 
  SortableContext, 
  arrayMove, 
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import './App.css';

const initialData = [
  {
    id: 'col-1',
    title: 'To Do',
    color: 'var(--accent-1)',
    tasks: [
      { id: 'task-1', content: 'Research competitor apps' },
      { id: 'task-2', content: 'Design the database schema' }
    ]
  },
  {
    id: 'col-2',
    title: 'In Progress',
    color: 'var(--accent-2)',
    tasks: [
      { id: 'task-3', content: 'Implement drag and drop' }
    ]
  },
  {
    id: 'col-3',
    title: 'Done',
    color: 'var(--accent-4)',
    tasks: []
  }
];

// --- TaskCard Component ---
function TaskCard({ task, columnId, handleDeleteTask }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: {
      type: 'Task',
      task,
      columnId,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...attributes} 
      {...listeners} 
      className="task-card"
    >
      <p>{task.content}</p>
      <button 
        className="delete-task-button"
        onPointerDown={(e) => e.stopPropagation()} // Stop drag when clicking delete
        onClick={(e) => {
          e.stopPropagation();
          handleDeleteTask(columnId, task.id);
        }}
        title="Delete Task"
      >
        ×
      </button>
    </div>
  );
}

// --- ColumnWrapper Component (for dropping on empty columns) ---
function ColumnWrapper({ column, children }) {
  const { setNodeRef } = useDroppable({
    id: column.id,
    data: {
      type: 'Column',
      column,
    },
  });

  return (
    <div ref={setNodeRef} className="board-column">
      {children}
    </div>
  );
}

// --- App Component ---
function App() {
  const [columns, setColumns] = useState(() => {
    const savedData = localStorage.getItem('kanban-board-data');
    if (savedData) {
      return JSON.parse(savedData);
    }
    return initialData;
  });

  useEffect(() => {
    localStorage.setItem('kanban-board-data', JSON.stringify(columns));
  }, [columns]);
  const [newTaskInput, setNewTaskInput] = useState({});
  const [activeTask, setActiveTask] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleInputChange = (columnId, value) => {
    setNewTaskInput({ ...newTaskInput, [columnId]: value });
  };

  const handleAddTask = (columnId) => {
    const content = newTaskInput[columnId];
    if (!content || content.trim() === '') return;

    const newTask = {
      id: `task-${Date.now()}`,
      content: content.trim()
    };

    setColumns(prevColumns => 
      prevColumns.map(col => {
        if (col.id === columnId) {
          return { ...col, tasks: [...col.tasks, newTask] };
        }
        return col;
      })
    );

    setNewTaskInput({ ...newTaskInput, [columnId]: '' });
  };

  const handleDeleteTask = (columnId, taskId) => {
    setColumns(prevColumns => 
      prevColumns.map(col => {
        if (col.id === columnId) {
          return { ...col, tasks: col.tasks.filter(t => t.id !== taskId) };
        }
        return col;
      })
    );
  };

  // --- Drag and Drop Logic ---
  const handleDragStart = (event) => {
    const { active } = event;
    if (active.data.current?.type === 'Task') {
      setActiveTask(active.data.current.task);
    }
  };

  const handleDragOver = (event) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const activeData = active.data.current;
    const overData = over.data.current;

    const isActiveTask = activeData?.type === 'Task';
    const isOverTask = overData?.type === 'Task';
    const isOverColumn = overData?.type === 'Column';

    if (!isActiveTask) return;

    setColumns(prevColumns => {
      const activeColumnId = activeData.columnId;
      let overColumnId;
      
      if (isOverTask) {
        overColumnId = overData.columnId;
      } else if (isOverColumn) {
        overColumnId = over.id;
      } else {
        return prevColumns;
      }

      if (activeColumnId === overColumnId) return prevColumns; // Handled in DragEnd

      // Moving to a different column
      const activeColumnIndex = prevColumns.findIndex(col => col.id === activeColumnId);
      const overColumnIndex = prevColumns.findIndex(col => col.id === overColumnId);

      const activeTaskIndex = prevColumns[activeColumnIndex].tasks.findIndex(t => t.id === activeId);
      
      const newColumns = [...prevColumns];
      const taskToMove = newColumns[activeColumnIndex].tasks[activeTaskIndex];
      
      // Remove from original
      newColumns[activeColumnIndex] = {
        ...newColumns[activeColumnIndex],
        tasks: newColumns[activeColumnIndex].tasks.filter(t => t.id !== activeId)
      };

      // Add to new
      let overTaskIndex = -1;
      if (isOverTask) {
        overTaskIndex = newColumns[overColumnIndex].tasks.findIndex(t => t.id === overId);
      }
      
      const newTasks = [...newColumns[overColumnIndex].tasks];
      if (overTaskIndex >= 0) {
        newTasks.splice(overTaskIndex, 0, taskToMove);
      } else {
        newTasks.push(taskToMove);
      }

      newColumns[overColumnIndex] = {
        ...newColumns[overColumnIndex],
        tasks: newTasks
      };

      // Update active data so it knows it's in a new column
      active.data.current.columnId = overColumnId;

      return newColumns;
    });
  };

  const handleDragEnd = (event) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;
    if (activeId === overId) return;

    const activeData = active.data.current;
    const overData = over.data.current;

    if (activeData?.type === 'Task' && overData?.type === 'Task') {
      const columnId = activeData.columnId;
      const overColumnId = overData.columnId;

      if (columnId === overColumnId) {
        // Reordering within the same column
        setColumns(prevColumns => {
          const columnIndex = prevColumns.findIndex(col => col.id === columnId);
          const tasks = prevColumns[columnIndex].tasks;
          const oldIndex = tasks.findIndex(t => t.id === activeId);
          const newIndex = tasks.findIndex(t => t.id === overId);

          const newColumns = [...prevColumns];
          newColumns[columnIndex] = {
            ...newColumns[columnIndex],
            tasks: arrayMove(tasks, oldIndex, newIndex)
          };
          return newColumns;
        });
      }
    }
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>✨ Kanban Board</h1>
      </header>

      <main className="board-container">
        <DndContext 
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          {columns.map((column) => (
            <ColumnWrapper key={column.id} column={column}>
              <div className="column-header" style={{ borderBottomColor: column.color }}>
                <h2>{column.title}</h2>
                <span className="task-count">{column.tasks.length}</span>
              </div>
              
              <div className="column-content">
                <SortableContext 
                  items={column.tasks.map(t => t.id)} 
                  strategy={verticalListSortingStrategy}
                >
                  {column.tasks.map((task) => (
                    <TaskCard 
                      key={task.id} 
                      task={task} 
                      columnId={column.id} 
                      handleDeleteTask={handleDeleteTask} 
                    />
                  ))}
                </SortableContext>

                <div className="add-task-container">
                  <input 
                    type="text" 
                    className="add-task-input"
                    placeholder="Add a new task..." 
                    value={newTaskInput[column.id] || ''}
                    onChange={(e) => handleInputChange(column.id, e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddTask(column.id)}
                  />
                  <button 
                    className="add-task-button"
                    onClick={() => handleAddTask(column.id)}
                    title="Add Task"
                  >
                    +
                  </button>
                </div>
              </div>
            </ColumnWrapper>
          ))}

          {/* This is the item being dragged */}
          <DragOverlay>
            {activeTask ? (
              <div className="task-card" style={{ cursor: 'grabbing', opacity: 0.9, transform: 'scale(1.05)' }}>
                <p>{activeTask.content}</p>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </main>
    </div>
  )
}

export default App;
