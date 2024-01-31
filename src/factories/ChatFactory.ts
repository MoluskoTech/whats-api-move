import { Client } from '../Client'
import { GroupChat } from '../structures/GroupChat'
import { PrivateChat } from '../structures/PrivateChat'
import { ChatData } from '../types/ChatData'

export class ChatFactory {
  static create(client: Client, data: ChatData) {
    if (data.isGroup) {
      return new GroupChat(client, data)
    }

    return new PrivateChat(client, data)
  }
}
