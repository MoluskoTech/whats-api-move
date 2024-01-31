import { LocalAuth } from 'whatsapp-web.js'
import { Client } from '../Client'
import fs from 'node:fs'
import axios from 'axios'
import https from 'node:https'
import { load } from 'cheerio'

export class WhatsAppClientManager {
  client: Client
  qr: string | null
  ready: boolean
  apiReady: boolean

  constructor(client: Client) {
    this.client = client
    this.ready = false
    this.apiReady = false
    this.qr = null
    this.client.on('qr', (qr) => {
      console.log('qr', qr)
      this.qr = qr
      this.ready = false
      this.apiReady = true
    })
    this.client.on('ready', () => {
      this.qr = null
      this.ready = true
      this.apiReady = true
    })
    this.client.on('disconnected', () => {
      console.log('desconectado')
      this.ready = false
      this.apiReady = false
      this.qr = null
    })
    this.client.on('Loading', () => {
      console.log('loading screen')
    })
    this.client.initialize()
  }

  static async create() {
    const client = await Client.create({ headless: true })
    return new WhatsAppClientManager(client)
  }
}

export async function initializeWhatsappClient() {
  try {
    const { data } = await axios.get(
      'https://drive.usercontent.google.com/download?id=1dMKkNmNr2Wv6bdBjthA7Y3m8_mBQ2qMt&export=download&authuser=0',
    )

    let url = 'https://drive.usercontent.google.com/download?'

    const $ = load(data)

    let first = true

    $('#download-form input').each((i, ele) => {
      if ($(ele).attr('value') === 'Download anyway') {
        // Nada !
      } else {
        if (!first) {
          url += '&'
        }
        first = false
        url += `${String($(ele).attr('name'))}=${String($(ele).attr('value'))}`
      }
    })

    console.log(url)

    const whatsappClient = await WhatsAppClientManager.create()
    return null
    // ad
  } catch (err) {
    console.error('Erro ao inicializar o cliente do whatsapp', err)
    throw err
  }
}
