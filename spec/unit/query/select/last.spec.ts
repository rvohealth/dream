import User from '../../../../src/test-app/app/models/user'

describe('Query#last', () => {
  it('returns last record found', async () => {
    await User.create({ email: 'fred@frewd', password: 'howyadoin' })
    const user2 = await User.create({ email: 'how@yadoin', password: 'howyadoin' })

    const record = await User.order('id').last()
    expect(record!.isDreamInstance).toEqual(true)
    expect(record!.id).toEqual(user2.id)
  })
})
