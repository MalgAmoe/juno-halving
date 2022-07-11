import { useState, useEffect } from 'react'
import './App.css';

function App() {
  const changeHeight = 5048093
  const [datas, setDatas] = useState(null)
  const [averageBlockTime, setAgerageBlockTime] = useState(0)
  const [blocksObserved, setBlockObserved] = useState(0)
  const [lastTimestamp, setLastTimestamp] = useState(null)

  useEffect(() => {
    const socket = new WebSocket('wss://rpc-juno.itastakers.com/websocket')
    socket.addEventListener('open', function (event) {
      socket.send(JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "subscribe",
        params: ["tm.event='NewBlock'"],
      }))
    })
    socket.addEventListener('message', function (event) {
      const { result } = JSON.parse(event.data)
      const { data } = result
      if (data?.type === 'tendermint/event/NewBlock') {
        const { height, time } = data.value.block.header
        setDatas({
          height,
          timestamp: new Date(time).valueOf()
        })
      }
    })
    return () => {
      socket.send(JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "unsubscribe",
        params: ["tm.event='NewBlock'"],
      }))
      socket.close()
    }
  }, [])

  useEffect(() => {
    if (datas && !lastTimestamp) {
      setLastTimestamp(datas.timestamp)
    } else if (datas) {
      const n = blocksObserved + 1
      // calculate average time with:
      // avgOfX(n) = avgOfX(n - 1) + (x(n) - avgOfX(n - 1)) / n
      setAgerageBlockTime(a => a + ((datas.timestamp - lastTimestamp) - a) / n)
      setLastTimestamp(datas.timestamp)
      setBlockObserved(n)
    }
    // if we put all dependencies the component is reloaded crazy amounts of times
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [datas])

  const getBlocksTogo = (changeHeight, height) => {
    if (!height) return '?'
    return changeHeight - height
  }

  const getTimeToGo = () => {
    return datas.timestamp + averageBlockTime * getBlocksTogo(changeHeight, datas.height)
  }

  return (
    <div className="App">
      <header className="App-header">
        {!datas && 'loading...'}
        {datas && <h2>{new Date(Math.floor(getTimeToGo())).toString()}</h2>}
        {datas && <p>
          block #{datas.height}
        </p>}
        {datas && <p>
          blocks to go: {getBlocksTogo(changeHeight, datas.height)}
        </p>}
        {datas && <p>
          average block time: {(averageBlockTime * 0.001).toPrecision(4)} s
        </p>}
        <a href="https://github.com/MalgAmoe/juno-halving">crappy code</a>
      </header>
    </div>
  );
}

export default App;
