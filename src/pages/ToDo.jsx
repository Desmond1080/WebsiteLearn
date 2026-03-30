import { useEffect, useState } from 'react'
import { supabase } from '../utils/supabaseClient'

function ToDo() {
    const [todoInput, setTodoInput] = useState('')
    const [todos, setTodos] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [editingId, setEditingId] = useState(null)
    const [editInput, setEditInput] = useState('')
    const [filter, setFilter] = useState('all')

    useEffect(() => {
        fetchTodos()
    }, [])

    async function fetchTodos() {
        setLoading(true)
        setError('')

        const { data, error: fetchError } = await supabase
            .from('todos')
            .select('id, title, is_completed')
            .order('id', { ascending: false })

        if (fetchError) {
            setError(fetchError.message)
            setLoading(false)
            return
        }

        setTodos(data ?? [])
        setLoading(false)
    }

    async function addTodo() {
        const title = todoInput.trim()
        if (!title) {
            setError('Task title cannot be empty.')
            return
        }

        if(title.length > 50){
            setError('Task title cannot exceed 50 characters.')
            return
        }

        const { data, error: insertError } = await supabase
            .from('todos')
            .insert({ title, is_completed: false })
            .select('id, title, is_completed')
            .single()

        if (insertError) {
            setError(insertError.message)
            return
        }

        setTodos((prev) => [data, ...prev])
        setTodoInput('')
        setError('')
    }

    async function deleteTodo(id) {
        const { error: deleteError } = await supabase.from('todos').delete().eq('id', id)
        if (deleteError) {
            setError(deleteError.message)
            return
        }

        setTodos((prev) => prev.filter((todo) => todo.id !== id))
    }

    async function toggleTodo(id, currentValue) {
        const { error: updateError } = await supabase
            .from('todos')
            .update({ is_completed: !currentValue })
            .eq('id', id)

        if (updateError) {
            setError(updateError.message)
            return
        }

        setTodos((prev) =>
            prev.map((todo) =>
                todo.id === id ? { ...todo, is_completed: !currentValue } : todo,
            ),
        )
    }

    function startEdit(todo) {
        setEditingId(todo.id)
        setEditInput(todo.title)
    }

    async function saveEdit(id) {
        const title = editInput.trim()
        if (!title) {
            return
        }

        const { error: updateError } = await supabase
            .from('todos')
            .update({ title })
            .eq('id', id)

        if (updateError) {
            setError(updateError.message)
            return
        }

        setTodos((prev) => prev.map((todo) => (todo.id === id ? { ...todo, title } : todo)))
        setEditingId(null)
        setEditInput('')
    }

    const filteredTodos = todos.filter((todo) => {
        if (filter === 'active') {
            return !todo.is_completed
        }

        if (filter === 'completed') {
            return todo.is_completed
        }

        return true
    })



    return (
        <section id="to-do-container">
            <h1>To-Do List</h1>
            <p>Manage your tasks here.</p>

            <section id="to-do-content">
                <div className="to-do-list">
                    <input
                        type="text"
                        value={todoInput}
                        onChange={(e) => setTodoInput(e.target.value)}
                        placeholder="Add a new task..."
                    />
                    <button className="btn btn-primary" onClick={addTodo}>
                        Add
                    </button>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                    <button className="btn btn-secondary" onClick={() => setFilter('all')}>
                        All
                    </button>
                    <button className="btn btn-secondary" onClick={() => setFilter('active')}>
                        Active
                    </button>
                    <button className="btn btn-secondary" onClick={() => setFilter('completed')}>
                        Completed
                    </button>
                </div>

                {error && <p style={{ color: 'crimson' }}>{error}</p>}
                {loading && <p>Loading todos...</p>}

                {!loading && (
                    <ul>
                        {filteredTodos.map((todo) => (
                            <li key={todo.id} style={{ marginBottom: '0.75rem' }}>
                                <input
                                    type="checkbox"
                                    checked={todo.is_completed}
                                    onChange={() => toggleTodo(todo.id, todo.is_completed)}
                                />

                                {editingId === todo.id ? (
                                    <>
                                        <input
                                            type="text"
                                            value={editInput}
                                            onChange={(e) => setEditInput(e.target.value)}
                                        />
                                        <button onClick={() => saveEdit(todo.id)}>Save</button>
                                        <button onClick={() => setEditingId(null)}>Cancel</button>
                                    </>
                                ) : (
                                    <>
                                        <span
                                            style={{
                                                marginInline: '0.5rem',
                                                textDecoration: todo.is_completed ? 'line-through' : 'none',
                                            }}
                                        >
                                            {todo.title}
                                        </span>
                                        <button onClick={() => startEdit(todo)}>Edit</button>
                                        <button onClick={() => deleteTodo(todo.id)}>Delete</button>
                                    </>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </section>
    )
}

export default ToDo