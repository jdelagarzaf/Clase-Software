import React from 'react'
import {Loading} from './Loading'
import {Card} from './Card'
import { useCounter } from '../hooks/useCounter'
import { useFetch } from '../hooks/useFetch'

export const CustomHook = () => {
    const { counter, increment, decrement, reset } = useCounter(1)
    const { data, isLoading, hasError } = useFetch(`https://pokeapi.co/api/v2/pokemon/${counter}`)
  return (
    <>
        <h1>Información de API de Pokemon</h1>
        <hr/>
        <h2>{data?.name}</h2>
        {isLoading ? <Loading/> : <Card id={counter} name={data.name} sprites={[
            data.sprites?.front_default,
            data.sprites?.back_default,
            data.sprites?.front_shiny,
            data.sprites?.back_shiny
        ]}/>}

        <button className='btn btn-danger' onClick={() => decrement()}>Anterior</button>
        <button className='btn btn-primary' onClick={() => increment()}>Siguiente</button>
        <button className='btn btn-info' onClick={() => reset()}>Reset</button>
    </>
  )
}