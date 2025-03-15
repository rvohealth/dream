import sharedPrefix from '../../../../src/helpers/path/sharedPathPrefix.js'

describe('sharedPrefix', () => {
  context('when the strings share nothing', () => {
    it('returns an empty string', () => {
      expect(sharedPrefix('abc', 'xyz')).toEqual('')
    })
  })

  context('when the first string is empty', () => {
    it('returns an empty string', () => {
      expect(sharedPrefix('', 'xyz')).toEqual('')
    })
  })

  context('when the second string is empty', () => {
    it('returns an empty string', () => {
      expect(sharedPrefix('abc', '')).toEqual('')
    })
  })

  context('when both strings are empty', () => {
    it('returns an empty string', () => {
      expect(sharedPrefix('', '')).toEqual('')
    })
  })

  context('when the strings don’t match', () => {
    it('returns the shared prefix', () => {
      expect(sharedPrefix('abcdefg', 'abcdxyz')).toEqual('')
    })

    context('when the first string is shorter', () => {
      it('returns the shared prefix', () => {
        expect(sharedPrefix('abcdef', 'abcdxyz')).toEqual('')
      })
    })

    context('when the second string is shorter', () => {
      it('returns the shared prefix', () => {
        expect(sharedPrefix('abcdefg', 'abcdxy')).toEqual('')
      })
    })
  })

  context('when the strings are identical', () => {
    it('returns the string', () => {
      expect(sharedPrefix('abc', 'abc')).toEqual('abc')
    })
  })

  context('when the strings include the path delimiter', () => {
    it('returns the shared prefix, including the trailing path delimiter', () => {
      expect(sharedPrefix('abcd/efg', 'abcd/xyz')).toEqual('abcd/')
    })

    context('when the strings share initial, but not all characters after a path delimiter', () => {
      it('omit the entire string after the path delimiter', () => {
        expect(sharedPrefix('abc/defg', 'abc/dxyz')).toEqual('abc/')
      })

      it('handles multiple path delimiters', () => {
        expect(sharedPrefix('abc/def/g', 'abc/def/gh')).toEqual('abc/def/')
      })
    })

    context('when the strings include utf-8 specific characters', () => {
      it('returns the shared prefix', () => {
        expect(sharedPrefix('☺abcd/efg', '☺abcd/xyz')).toEqual('☺abcd/')
      })
    })
  })
})
