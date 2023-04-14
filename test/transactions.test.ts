import { test, beforeAll, afterAll, describe, expect, beforeEach } from 'vitest'
import { execSync } from 'node:child_process'
import request from 'supertest'
import { app } from '../src/app'

describe('transactions routes', () => {
  beforeAll(async () => {
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(() => {
    execSync('npm run knex migrate:rollback --all')
    execSync('npm run knex migrate:latest')
  })

  describe('created transaction', () => {
    test('use can create a new transaction', async () => {
      await request(app.server)
        .post('/transactions')
        .send({
          title: 'New trans',
          amount: 5000,
          type: 'credit',
        })
        .expect(201)
    })
  })

  describe('list all transactions use the set-cookie', () => {
    test('to list all transactions', async () => {
      const createTransectionResponse = await request(app.server)
        .post('/transactions')
        .send({
          title: 'New trans',
          amount: 5000,
          type: 'credit',
        })

      const cookies = createTransectionResponse.get('Set-Cookie')

      const listTransactionResponde = await request(app.server)
        .get(`/transactions`)
        .set('Cookie', cookies)
        .expect(200)

      expect(listTransactionResponde.body.transactions).toEqual([
        expect.objectContaining({
          title: 'New trans',
          amount: 5000,
        }),
      ])
    })
  })

  test('should be able to get a specific transaction', async () => {
    const createTransactionResponse = await request(app.server)
      .post('/transactions')
      .send({
        title: 'New transaction',
        amount: 5000,
        type: 'credit',
      })

    const cookies = createTransactionResponse.get('Set-Cookie')

    const listTransactionsResponse = await request(app.server)
      .get('/transactions')
      .set('Cookie', cookies)
      .expect(200)

    const transactionId = listTransactionsResponse.body.transactions[0].id

    const getTransactionResponse = await request(app.server)
      .get(`/transactions/${transactionId}`)
      .set('Cookie', cookies)
      .expect(200)

    console.log(getTransactionResponse.body)

    expect(getTransactionResponse.body).toEqual(
      expect.objectContaining({
        title: 'New transaction',
        amount: 5000,
      }),
    )
  })

  test('get the summary', async () => {
    const createTransectionResponse = await request(app.server)
      .post('/transactions')
      .send({
        title: 'Credit transaction',
        amount: 5000,
        type: 'credit',
      })

    const cookies = createTransectionResponse.get('Set-Cookie')

    await request(app.server)
      .post('/transactions')
      .set('Cookie', cookies)
      .send({
        title: 'Debit transaction',
        amount: 2000,
        type: 'debit',
      })

    const summaryResponse = await request(app.server)
      .get(`/transactions/summary`)
      .set('Cookie', cookies)
      .expect(200)

    expect(summaryResponse.body.summary).toEqual({
      amount: 3000,
    })
  })
})
