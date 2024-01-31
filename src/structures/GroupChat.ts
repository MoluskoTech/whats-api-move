import { ChatData } from '../types/ChatData'
import { Chat } from './Chat'

export class GroupChat extends Chat {
  groupMetadata!: string

  _patch(data: ChatData) {
    this.groupMetadata = data.groupMetadata

    super._patch(data)
  }
}
