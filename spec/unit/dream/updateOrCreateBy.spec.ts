import Composition from '../../../test-app/app/models/Composition.js'
import User from '../../../test-app/app/models/User.js'

describe('Dream.updateOrCreateBy', () => {
  context('no underlying conflicts to prevent save', () => {
    it('creates the underlying model in the db', async () => {
      const u = await User.updateOrCreateBy({ email: 'trace@frewd' }, { with: { password: 'howyadoin' } })
      // attributes consistently or attributes here / createWith on findOrCreateBy
      const user = await User.find(u.id)
      expect(user!.email).toEqual('trace@frewd')
      expect(await user!.checkPassword('howyadoin')).toEqual(true)
    })

    it('respects associations in primary opts with user', async () => {
      const user = await User.create({ email: 'trace@trace', password: 'howyadoin' })
      const composition = await Composition.updateOrCreateBy({ user }, { with: { content: 'howyadoin' } })
      expect(composition.userId).toEqual(user.id)
      expect(composition.content).toEqual('howyadoin')
    })

    it('respects associations in primary opts with userId', async () => {
      const user = await User.create({ email: 'trace@trace', password: 'howyadoin' })
      const composition = await Composition.updateOrCreateBy(
        { userId: user.id },
        { with: { content: 'howyadoin' } }
      )
      expect(composition.userId).toEqual(user.id)
      expect(composition.content).toEqual('howyadoin')
    })

    it('respects associations in secondary opts with user', async () => {
      const user = await User.create({ email: 'trace@trace', password: 'howyadoin' })
      const composition = await Composition.updateOrCreateBy({ content: 'howyadoin' }, { with: { user } })
      expect(composition.userId).toEqual(user.id)
    })

    it('respects associations in secondary opts with userId', async () => {
      const user = await User.create({ email: 'trace@trace', password: 'howyadoin' })
      const composition = await Composition.updateOrCreateBy(
        { content: 'howyadoin' },
        { with: { userId: user.id } }
      )
      expect(composition.userId).toEqual(user.id)
    })
  })

  context('when a conflicting record already exists in the db', () => {
    beforeEach(async () => {
      await User.create({ email: 'trace@trace', password: 'howyadoin' })
    })

    it('updates the existing record', async () => {
      const u = await User.updateOrCreateBy({ email: 'trace@trace' }, { with: { password: 'newpassword' } })
      const user = await User.find(u.id)
      expect(user!.email).toEqual('trace@trace')
      expect(await user!.checkPassword('newpassword')).toEqual(true)
    })
  })

  it('respects associations in primary opts with user', async () => {
    const user = await User.create({ email: 'trace@trace', password: 'howyadoin' })
    await Composition.create({ user, content: 'howyadoin' })

    const composition = await Composition.updateOrCreateBy({ user }, { with: { content: 'newcontent' } })

    expect(composition.userId).toEqual(user.id)
    expect(composition.content).toEqual('newcontent')
  })

  it('respects associations in primary opts with userId', async () => {
    const user = await User.create({ email: 'trace@trace', password: 'howyadoin' })
    await Composition.create({ user, content: 'howyadoin' })

    const composition = await Composition.updateOrCreateBy(
      { userId: user.id },
      { with: { content: 'newcontent' } }
    )

    expect(composition.userId).toEqual(user.id)
    expect(composition.content).toEqual('newcontent')
  })

  it('respects associations in secondary opts with user', async () => {
    const user = await User.create({ email: 'trace@trace', password: 'howyadoin' })
    const otherUser = await User.create({ email: 'trace@hi', password: 'notbad' })
    await Composition.create({ content: 'howyadoin', user: otherUser })

    const composition = await Composition.updateOrCreateBy({ content: 'howyadoin' }, { with: { user } })
    expect(composition.userId).toEqual(user.id)
  })

  it('respects associations in secondary opts with userId', async () => {
    const user = await User.create({ email: 'trace@trace', password: 'howyadoin' })
    const otherUser = await User.create({ email: 'new@trace', password: 'notbad' })
    await Composition.create({ content: 'howyadoin', user: otherUser })

    const composition = await Composition.updateOrCreateBy(
      { content: 'howyadoin' },
      { with: { userId: user.id } }
    )
    expect(composition.userId).toEqual(user.id)
  })
})
