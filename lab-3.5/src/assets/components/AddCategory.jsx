import { useState } from "react";

export const AddCategory = ({ onNewCategory }) => {
    const [inputValue, setInputValue] = useState('');

    const onInputChange = ({ target }) => {
        setInputValue(target.value);
    }

    const onSubmit = (event) => {
        event.preventDefault();
        if (inputValue.trim().length <= 1) return;
        // setCategories(categories => [inputValue, ...categories]);
        setInputValue('');
        onNewCategory(inputValue.trim());
    }

    return (
        <form onSubmit={(event) => onSubmit(event)} aria-label="form">
            <label>Input:</label>
            <input type="text" placeholder="Buscar images" value={inputValue} onChange={onInputChange} />
        </form>
    )
}