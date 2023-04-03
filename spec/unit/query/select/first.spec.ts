import User from '../../../../src/test-app/app/models/user'

describe('Query#first', () => {
  it('returns first record found', async () => {
    const user1 = await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    await User.create({ email: 'how@yadoin', password: 'howyadoin' })

    const record = await User.order('id').first()
    expect(record.id).toEqual(user1.id)
  })
})
