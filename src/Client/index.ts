import puppeteer, {
  TimeoutError,
  Page,
  Browser,
  PuppeteerLaunchOptions,
} from 'puppeteer'
import fs from 'node:fs'
import { ExposeStore, LoadUtils } from '../Util/injected'
import EventEmitter from 'node:events'
import { ChatFactory } from '../factories/ChatFactory'
import { ChatData } from '../types/ChatData'
import { env } from '../env'
import { join } from 'node:path'

interface Initialize {
  headless: 'new' | true | false
}

export class Client extends EventEmitter {
  private _qr = ''
  public get qr() {
    return this._qr
  }

  private set qr(value) {
    this._qr = value
    this.emit('qr', value)
  }

  private _status:
    | 'Authenticate'
    | 'ready'
    | 'disconnected'
    | 'Loading'
    | 'Loading_chats' = 'Authenticate'

  public get status() {
    return this._status
  }

  private set status(value) {
    this._status = value
    console.log('status alterado para: ', value)
    this.emit(value)
  }

  public loading = false
  public needsQr = true
  private FILEPATH = 'localStorage.json'
  private page: Page
  private browser: Browser
  private loadingMessage =
    env.NODE_ENV === 'development'
      ? 'Carregando suas conversas'
      : 'Loading your chats'

  constructor(browser: Browser, page: Page) {
    super()
    this.page = page
    this.browser = browser
  }

  private pathScreen =
    env.NODE_ENV === 'development'
      ? join(__dirname, '..', '..', 'public')
      : join(__dirname, '..', 'public')

  static async create({ headless }: Initialize) {
    try {
      const launchOptions = {
        headless: headless === 'new' ? 'new' : headless,
        // userDataDir: 'tete1',
        executablePath: env.PUPPETEER_EXECUTABLE_PATH,
        // args: [
        //   '--disable-gpu',
        //   '--disable-extensions',
        //   '--disable-dev-shm-usage',
        // ],
      } as PuppeteerLaunchOptions

      const browser = await puppeteer.launch(launchOptions)
      const page = await browser.newPage()

      return new Client(browser, page)
    } catch (e) {
      console.log('Erro ao criar o cliente: ', e)
    }
  }

  async reset() {
    const launchOptions = {
      headless: true,
      // userDataDir: 'tete1',
      executablePath: env.PUPPETEER_EXECUTABLE_PATH,
    } as PuppeteerLaunchOptions

    this.browser = await puppeteer.launch(launchOptions)
    this.page = await this.browser.newPage()
  }

  firstError = true

  async initialize() {
    try {
      const pageClient = await this.page.target().createCDPSession()
      await pageClient.send('Storage.clearDataForOrigin', {
        origin: '*',
        storageTypes:
          'appcache,cookies,indexeddb,local_storage,shader_cache,websql,service_workers,cache_storage',
      })
      this.loading = false
      this.needsQr = true
      this.status = 'Authenticate'
      await this.page.setUserAgent(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_4) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/11.1 Safari/605.1.15',
      )
      // await this.page.setRequestInterception(true)
      // this.page.on('request', (request) => {
      //   if (['image', 'stylesheet'].includes(request.resourceType())) {
      //     request.abort()
      //   } else {
      //     request.continue()
      //   }
      // })
      await this.page.setViewport({ width: 1920, height: 1080 })
      this.page.setBypassCSP(true)
      await this.page.goto('https://web.whatsapp.com/')
      this.page.on('console', (msg) => {
        if (
          msg.text().indexOf('Failed to load resource: net::ERR_FAILED') === -1
        ) {
          console.log('PAGE LOG:', msg.text())
        }
      })

      this.page.on('error', (err) => {
        console.log('PAGE ERROR:', err)
      })
      this.page.on('pageerror', (err) => {
        console.log('PAGE ERROR:', err)
      })

      const element = await this.page.waitForSelector('div > .landing-title', {
        timeout: 8000,
      })

      if (element) {
        await this.page.waitForSelector('[data-ref]')
        const a = await this.page.$eval('[data-ref]', (el) =>
          el.getAttribute('data-ref'),
        )
        if (a) {
          this.qr = a
        }
        setTimeout(() => {
          this.refreshQr()
        }, 1000)
      }
    } catch (e) {
      if (e instanceof TimeoutError) {
        console.log('Não achou landing-page')
      }
      console.log('Erro ao inicializar o cliente: ', e)
    }
  }

  private async saveLocalStorage() {
    const localStorageData = await this.page.evaluate(() => {
      const data = {} as any
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key) {
          const value = localStorage.getItem(key)
          data[key] = value
        }
      }
      return data
    })

    fs.writeFileSync(this.FILEPATH, JSON.stringify(localStorageData))
  }

  private async injections() {
    await this.page.waitForFunction('window.ModuleRaid !== undefined')
    await this.page.evaluate(ExposeStore)
    await this.page.evaluate(LoadUtils)
    this.loadChats()
  }

  private async waitForLoadingMessageExit() {
    try {
      const loadingMessage = await this.page.waitForXPath(
        `//div[contains(text(), "${this.loadingMessage}")]`,
        { timeout: 500 },
      )
      if (loadingMessage) {
        setTimeout(() => {
          this.waitForLoadingMessageExit()
        }, 1000)
      }
    } catch (e) {
      if (e instanceof TimeoutError) {
        await this.saveLocalStorage()
        this.page.setBypassCSP(true)

        await this.page.addScriptTag({
          url: 'https://unpkg.com/moduleraid/dist/moduleraid.iife.js',
        })
        await this.injections()
      }
    }
  }

  private async refreshQr() {
    if (!this.loading && this.needsQr) {
      try {
        const loadingMessage = await this.page.waitForXPath(
          `//div[contains(text(), "${this.loadingMessage}")]`,
          { timeout: 500 },
        )
        if (loadingMessage) {
          this.status = 'Loading'
          this.needsQr = false
          this.qr = ''
          this.loading = true
          await this.waitForLoadingMessageExit()
        }
      } catch (e) {
        if (e instanceof TimeoutError) {
          // Não precisa acontecer nada mesmo :)
        }
      }
    }

    if (this.needsQr) {
      try {
        await this.page.waitForSelector('[data-ref]')
        const qrPage = await this.page.$eval('[data-ref]', (el) =>
          el.getAttribute('data-ref'),
        )
        if (qrPage && qrPage !== this.qr) {
          this.qr = qrPage
        }
        setTimeout(() => {
          this.refreshQr()
        }, 1000)
      } catch (e) {
        if (e instanceof TimeoutError) {
          // Não precisa acontecer nada mesmo :)
          this.refreshQr()
        }
      }
    }
  }

  async sendMessage(chatId: string, content: string, options = {}) {
    const msg = await this.page.evaluate(
      async (chatId, content) => {
        const chatWid = window.Store.WidFactory.createWid(chatId)
        const chat = await window.Store.Chat.find(chatWid)
        const msg = await window.WWebJS.sendMessage(chat, content, {})
        return msg
      },
      chatId,
      content,
    )
    return msg
  }

  async getChats() {
    const chats = (await this.page.evaluate(async () => {
      return await window.WWebJS.getChats()
    })) as ChatData[]
    return chats.map((chat) => ChatFactory.create(this, chat))
  }

  async getGroups() {
    const chats = (await this.page.evaluate(async () => {
      const msgsChat = await window.WWebJS.getChats()
      return msgsChat
    })) as any[]
    const groups = chats.filter((chat) => chat.isGroup)

    return groups.map((group) => ChatFactory.create(this, group))
  }

  loadChats() {
    this.status = 'ready'
  }

  async disconnect() {
    await this.initialize()
  }
}
