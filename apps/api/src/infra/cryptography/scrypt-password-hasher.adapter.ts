import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'
import type { PasswordHasherPort } from '../../application/ports/password-hasher.port.js'

const scryptAsync = promisify(scryptCallback)

export class ScryptPasswordHasherAdapter implements PasswordHasherPort {
  async hash(plainPassword: string): Promise<string> {
    const salt = randomBytes(16).toString('hex')
    const derivedKey = (await scryptAsync(plainPassword, salt, 64)) as Buffer
    return `${salt}:${derivedKey.toString('hex')}`
  }

  async verify(plainPassword: string, passwordHash: string): Promise<boolean> {
    const [salt, keyHex] = passwordHash.split(':')
    if (!salt || !keyHex) {
      return false
    }

    const keyBuffer = Buffer.from(keyHex, 'hex')
    const derivedBuffer = (await scryptAsync(plainPassword, salt, 64)) as Buffer

    if (keyBuffer.length !== derivedBuffer.length) {
      return false
    }

    return timingSafeEqual(keyBuffer, derivedBuffer)
  }
}
