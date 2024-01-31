import { Client } from '../Client'
import { ChatData } from '../types/ChatData'
import { Base } from './Base'
import { Message } from './Message'

export class Chat extends Base {
  id!: {
    _serialized: string
  }

  name!: string
  isGroup!: boolean
  isReadOnly!: boolean
  unreadCount!: number
  timestamp!: number
  archived!: boolean
  pinned!: boolean
  isMuted!: boolean
  muteExpiration!: number
  lastMessage?: Message

  constructor(client: Client, data: ChatData) {
    super(client)

    if (data) this._patch(data)
  }

  _patch(data: ChatData) {
    this.id = data.id

    this.name = data.formattedTitle

    this.isGroup = data.isGroup

    this.isReadOnly = data.isReadOnly

    this.unreadCount = data.unreadCount

    this.timestamp = data.t
    this.archived = data.archived
    this.pinned = !!data.pin
    this.isMuted = data.isMuted
    this.muteExpiration = data.muteExpiration
    /* this.lastMessage = data.lastMessage
      ? new Message(client, data.lastMessage)
      : undefined */
  }

  async sendMessage(content: string, options = {}) {
    return this.client.sendMessage(this.id._serialized, content, options)
  }
}
