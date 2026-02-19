import React from 'react'
import {Loading} from './Loading'
import {Card} from './Card'
import { useCounter } from '../hooks/useCounter'
import { useFetch } from '../hooks/useFetch'

export const CustomHook = () => {
    const { counter, increment, decrement, reset } = useCounter(350)
    const { data, isLoading, hasError } = useFetch(`https://api.disneyapi.dev/character/${counter}`)
  return (
    <>
        <h1>Información de API de Disney</h1>
        <hr/>
        <button className='btn btn-danger' onClick={() => decrement()}>Anterior</button>
        <button className='btn btn-primary' onClick={() => increment()}>Siguiente</button>
        <button className='btn btn-info' onClick={() => reset()}>Reset</button>
        
        <h2>{data?.data?.name}</h2>
        {isLoading ? <Loading/> : <Card id={counter} name={data.data.name} sprites={[
            data.data.imageUrl
        ]}/>}

        
    </>
  )
}