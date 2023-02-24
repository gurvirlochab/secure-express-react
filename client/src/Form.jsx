import { useState } from 'react'

export const Form = () => {
    const [inputs, setInputs] = useState({})

    const handleChange = (event) => {
        const name = event.target.name
        const value = event.target.value
        setInputs((values) => ({ ...values, [name]: value }))
    }
    async function callAPI() {
        try {
            const res = await fetch('http://localhost:3000/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    inputs,
                }),
            })
            const data = await res.json()
            alert('Successfully inserted record')
            return data
        } catch (err) {
            console.log(err)
        }
    }

    const handleSubmit = (event) => {
        event.preventDefault()
        callAPI()
    }

    return (
        <form onSubmit={handleSubmit}>
            <label>
                Name:
                <input
                    type='text'
                    name='name'
                    value={inputs.name || ''}
                    onChange={handleChange}
                />
            </label>
            <label>
                Email:
                <input
                    type='email'
                    name='email'
                    value={inputs.email || ''}
                    onChange={handleChange}
                />
            </label>
            <button type='submit'>Save</button>
        </form>
    )
}
