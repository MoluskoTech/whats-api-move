import { Client } from '../Client'
import { ChatData } from '../types/ChatData'

export class Base {
  public client: Client
  constructor(client: Client) {
    this.client = client
    Object.defineProperty(this, 'client', { value: client })
  }

  _clone() {
    return Object.assign(Object.create(this), this)
  }

  _patch(data: ChatData, client: Client) {
    // console.log()
  }
}
