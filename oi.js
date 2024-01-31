function(instance, properties, context) {
  let qrExists = false
  let qrString = ''
  const url = 'https://one11222-g8pm.onrender.com/instance/groups'
  
  const data = {
      message: properties.message,
      nomeGrupo: properties.group_name,
  }
  
  const requestOptions = {
      method: 'POST',
      headers: {
          'Content-Type' : 'application/json'
      },
      body: JSON.stringify(data)
  }
  
  fetch(url, requestOptions)
    .then(response => response.json())
    .then(data => {
      if(data.errorNumber === 101){
         instance.data.divElement.innerHTML = ''
          instance.data.divElement.style.display = 'flex'
          qrExists = true
         new QRCode(instance.data.divElement, data.qr)
      }
  }).catch(error => {
      console.log('error: ', error.message)
  })
  
  if(qrExists){
      const socket = new WebSocket('wss://one11222-g8pm.onrender.com/instance/qr')
  
    socket.on('message', (event) => {
        console.log({data: event.data})
        console.log(event.data)
        console.log('ready: ',event.data === 'ready' )
        if(event.data === 'ready') {
            console.log('Entrou no ready')
            fetch(url, requestOptions)
      .then(response => response.json())
      .then(data => {
        if(data.errorNumber === 101){
           instance.data.divElement.innerHTML = ''
            instance.data.divElement.style.display = 'flex'
           new QRCode(instance.data.divElement, data.qr)
        }
    }).catch(error => {
        console.log('error: ', error.message)
    })
            return
        }
        instance.data.divElement.innerHTML = ''
        new QRCode(instance.data.divElement, event.data)
    })
  }
}