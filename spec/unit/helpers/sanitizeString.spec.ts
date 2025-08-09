import sanitizeString from '../../../src/helpers/sanitizeString.js'

describe('sanitizeSerializedValue', () => {
  context('with a custom sanitization strategy', () => {
    it('uses the custom strategy', () => {
      expect(sanitizeString('Hello', (val: string) => val.replace(/l/g, 'L'))).toBe('HeLLo')
    })
  })

  context('unicodeString strategy', () => {
    context('basic HTML characters', () => {
      it('converts less-than symbol to unicode string', () => {
        expect(sanitizeString('<', 'unicodeString')).toBe('\\u003c')
      })

      it('converts greater-than symbol to unicode string', () => {
        expect(sanitizeString('>', 'unicodeString')).toBe('\\u003e')
      })

      it('converts ampersand to unicode string', () => {
        expect(sanitizeString('&', 'unicodeString')).toBe('\\u0026')
      })

      it('converts double quotes to unicode string', () => {
        expect(sanitizeString('"', 'unicodeString')).toBe('\\u0022')
      })

      it('converts single quotes to unicode string', () => {
        expect(sanitizeString("'", 'unicodeString')).toBe('\\u0027')
      })

      it('converts forward slash to unicode string (prevents closing tags)', () => {
        expect(sanitizeString('/', 'unicodeString')).toBe('\\u002f')
      })

      it('converts backward slash to unicode string (prevents closing tags)', () => {
        expect(sanitizeString('\\', 'unicodeString')).toBe('\\u005c')
      })
    })

    context('script injection attempts', () => {
      it('sanitizes script tags', () => {
        const input = '<script>alert("xss")</script>'
        const expected = '\\u003cscript\\u003ealert(\\u0022xss\\u0022)\\u003c\\u002fscript\\u003e'
        expect(sanitizeString(input, 'unicodeString')).toBe(expected)
      })

      it('sanitizes img tags with onerror', () => {
        const input = '<img src="x" onerror="alert(1)">'
        const expected = '\\u003cimg src=\\u0022x\\u0022 onerror=\\u0022alert(1)\\u0022\\u003e'
        expect(sanitizeString(input, 'unicodeString')).toBe(expected)
      })

      it('sanitizes iframe tags', () => {
        const input = '<iframe src="javascript:alert(1)"></iframe>'
        const expected =
          '\\u003ciframe src=\\u0022javascript:alert(1)\\u0022\\u003e\\u003c\\u002fiframe\\u003e'
        expect(sanitizeString(input, 'unicodeString')).toBe(expected)
      })
    })

    context('event handlers', () => {
      it('sanitizes onclick attributes', () => {
        const input = '<div onclick="maliciousCode()">Click me</div>'
        const expected =
          '\\u003cdiv onclick=\\u0022maliciousCode()\\u0022\\u003eClick me\\u003c\\u002fdiv\\u003e'
        expect(sanitizeString(input, 'unicodeString')).toBe(expected)
      })

      it('sanitizes onload attributes', () => {
        const input = '<body onload="steal()">'
        const expected = '\\u003cbody onload=\\u0022steal()\\u0022\\u003e'
        expect(sanitizeString(input, 'unicodeString')).toBe(expected)
      })
    })

    context('data preservation', () => {
      it('preserves exact original data when decoded', () => {
        const originalCode = 'if (x < 5 && y > "test") { console.log("hello"); }'
        const sanitized = sanitizeString(originalCode, 'unicodeString')

        // Should be safely encoded
        expect(sanitized).toBe(
          'if (x \\u003c 5 \\u0026\\u0026 y \\u003e \\u0022test\\u0022) { console.log(\\u0022hello\\u0022); }'
        )

        // But when decoded (by browser or HTML parser), becomes exact original
        const decoded = sanitized
          .replace(/\\u003c/g, '<')
          .replace(/\\u003e/g, '>')
          .replace(/\\u0022/g, '"')
          .replace(/\\u0027/g, "'")
          .replace(/\\u002f/g, '/')
          .replace(/\\u0026/g, '&')

        expect(decoded).toBe(originalCode)
      })
    })

    it('handles URLs with query parameters', () => {
      const input = 'Visit https://example.com?param="value"&other=<data>'
      const expected =
        'Visit https:\\u002f\\u002fexample.com?param=\\u0022value\\u0022\\u0026other=\\u003cdata\\u003e'
      expect(sanitizeString(input, 'unicodeString')).toBe(expected)
    })

    context('edge cases', () => {
      it('handles empty string', () => {
        expect(sanitizeString('', 'unicodeString')).toBe('')
      })

      it('handles null and undefined', () => {
        expect(sanitizeString(null, 'unicodeString')).toBeNull()
        expect(sanitizeString(undefined, 'unicodeString')).toBeUndefined()
      })

      it('handles string with only safe characters', () => {
        const input = 'This is perfectly safe text with numbers 123 and symbols !@#$%^*()'
        expect(sanitizeString(input, 'unicodeString')).toBe(input)
      })

      it('handles repeated dangerous characters', () => {
        const input = '<<>>&&&"""'
        const expected = '\\u003c\\u003c\\u003e\\u003e\\u0026\\u0026\\u0026\\u0022\\u0022\\u0022'
        expect(sanitizeString(input, 'unicodeString')).toBe(expected)
      })
    })

    context('JSON serialization compatibility', () => {
      it('maintains HTML entities through JSON.stringify and JSON.parse', () => {
        const input = '<script>alert("test")</script>'
        const sanitized = sanitizeString(input, 'unicodeString')
        const jsonString = JSON.stringify({ content: sanitized })
        const parsed = JSON.parse(jsonString)

        expect(parsed.content).toBe(
          '\\u003cscript\\u003ealert(\\u0022test\\u0022)\\u003c\\u002fscript\\u003e'
        )
        expect(parsed.content).not.toContain('<')
        expect(parsed.content).not.toContain('>')
        expect(parsed.content).not.toContain('"')
      })

      it('works with complex objects that get JSONified', () => {
        const data = {
          title: 'Article <title>',
          content: 'Content with "quotes" & <tags>',
          metadata: {
            author: "O'Reilly & Associates",
          },
        }

        const sanitized = {
          title: sanitizeString(data.title, 'unicodeString'),
          content: sanitizeString(data.content, 'unicodeString'),
          metadata: {
            author: sanitizeString(data.metadata.author, 'unicodeString'),
          },
        }

        const jsonString = JSON.stringify(sanitized)
        const parsed = JSON.parse(jsonString)

        expect(parsed.title).toBe('Article \\u003ctitle\\u003e')
        expect(parsed.content).toBe('Content with \\u0022quotes\\u0022 \\u0026 \\u003ctags\\u003e')
        expect(parsed.metadata.author).toBe('O\\u0027Reilly \\u0026 Associates')
      })
    })

    context('Unicode character preservation', () => {
      it('preserves existing Unicode characters while sanitizing HTML', () => {
        const input = 'Hello 世界 & <test>'
        const expected = 'Hello 世界 \\u0026 \\u003ctest\\u003e'
        expect(sanitizeString(input, 'unicodeString')).toBe(expected)
      })

      it('preserves emojis and special Unicode while sanitizing HTML', () => {
        const input = '🚀 Launch <rocket> "soon"!'
        const expected = '🚀 Launch \\u003crocket\\u003e \\u0022soon\\u0022!'
        expect(sanitizeString(input, 'unicodeString')).toBe(expected)
      })
    })

    context('real-world attack vectors', () => {
      it('sanitizes data URIs', () => {
        const input = '<img src="data:text/html,<script>alert(1)</script>">'
        const result = sanitizeString(input, 'unicodeString')
        expect(result).not.toContain('<script>')
        expect(result).toContain('\\u003cscript\\u003e')
      })

      it('sanitizes JavaScript URIs', () => {
        const input = '<a href="javascript:alert(\'xss\')">Click</a>'
        const result = sanitizeString(input, 'unicodeString')
        expect(result).not.toContain('<a')
        expect(result).not.toContain("'")
        expect(result).toContain('\\u003ca')
        expect(result).toContain('\\u0027')
      })

      it('sanitizes CSS expression injection', () => {
        const input = '<div style="background:url(\'javascript:alert(1)\')">Content</div>'
        const result = sanitizeString(input, 'unicodeString')
        expect(result).not.toContain('<div')
        expect(result).not.toContain("'")
        expect(result).toContain('\\u003cdiv')
        expect(result).toContain('\\u0027')
      })
    })

    context('when used with template rendering', () => {
      it('produces safe output that displays correctly when rendered in HTML', () => {
        const userInput = 'User said: <script>alert("hack")</script>'
        const sanitized = sanitizeString(userInput, 'unicodeString')

        // When this gets rendered in HTML, it will display as:
        // "User said: <script>alert("hack")</script>"
        // But won't execute as code because it's entity-encoded
        expect(sanitized).toBe(
          'User said: \\u003cscript\\u003ealert(\\u0022hack\\u0022)\\u003c\\u002fscript\\u003e'
        )
      })
    })

    context('performance with large strings', () => {
      it('handles large strings efficiently', () => {
        const dangerousChar = '<script>alert("xss")</script>'
        const largeInput = dangerousChar.repeat(1000)
        const result = sanitizeString(largeInput, 'unicodeString')

        expect(result).not.toContain('<script>')
        expect(result).not.toContain('"')
        expect(result).toContain('\\u003cscript\\u003e')
        expect(result).toContain('\\u0022')
        expect(result.length).toBeGreaterThan(0)
      })
    })
  })

  context('htmlEntity strategy', () => {
    context('basic HTML characters', () => {
      it('converts less-than symbol to HTML entity', () => {
        expect(sanitizeString('<', 'htmlEntity')).toBe('&lt;')
      })

      it('converts greater-than symbol to HTML entity', () => {
        expect(sanitizeString('>', 'htmlEntity')).toBe('&gt;')
      })

      it('converts ampersand to HTML entity', () => {
        expect(sanitizeString('&', 'htmlEntity')).toBe('&amp;')
      })

      it('converts double quotes to HTML entity', () => {
        expect(sanitizeString('"', 'htmlEntity')).toBe('&quot;')
      })

      it('converts single quotes to HTML entity', () => {
        expect(sanitizeString("'", 'htmlEntity')).toBe('&#x27;')
      })

      it('converts forward slash to HTML entity (prevents closing tags)', () => {
        expect(sanitizeString('/', 'htmlEntity')).toBe('&#x2F;')
      })
    })

    context('script injection attempts', () => {
      it('sanitizes script tags', () => {
        const input = '<script>alert("xss")</script>'
        const expected = '&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;'
        expect(sanitizeString(input, 'htmlEntity')).toBe(expected)
      })

      it('sanitizes img tags with onerror', () => {
        const input = '<img src="x" onerror="alert(1)">'
        const expected = '&lt;img src=&quot;x&quot; onerror=&quot;alert(1)&quot;&gt;'
        expect(sanitizeString(input, 'htmlEntity')).toBe(expected)
      })

      it('sanitizes iframe tags', () => {
        const input = '<iframe src="javascript:alert(1)"></iframe>'
        const expected = '&lt;iframe src=&quot;javascript:alert(1)&quot;&gt;&lt;&#x2F;iframe&gt;'
        expect(sanitizeString(input, 'htmlEntity')).toBe(expected)
      })
    })

    context('event handlers', () => {
      it('sanitizes onclick attributes', () => {
        const input = '<div onclick="maliciousCode()">Click me</div>'
        const expected = '&lt;div onclick=&quot;maliciousCode()&quot;&gt;Click me&lt;&#x2F;div&gt;'
        expect(sanitizeString(input, 'htmlEntity')).toBe(expected)
      })

      it('sanitizes onload attributes', () => {
        const input = '<body onload="steal()">'
        const expected = '&lt;body onload=&quot;steal()&quot;&gt;'
        expect(sanitizeString(input, 'htmlEntity')).toBe(expected)
      })
    })

    context('data preservation', () => {
      it('preserves exact original data when decoded', () => {
        const originalCode = 'if (x < 5 && y > "test") { console.log("hello"); }'
        const sanitized = sanitizeString(originalCode, 'htmlEntity')

        // Should be safely encoded
        expect(sanitized).toBe(
          'if (x &lt; 5 &amp;&amp; y &gt; &quot;test&quot;) { console.log(&quot;hello&quot;); }'
        )

        // But when decoded (by browser or HTML parser), becomes exact original
        const decoded = sanitized
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&#x27;/g, "'")
          .replace(/&#x2F;/g, '/')
          .replace(/&amp;/g, '&')

        expect(decoded).toBe(originalCode)
      })
    })

    it('handles URLs with query parameters', () => {
      const input = 'Visit https://example.com?param="value"&other=<data>'
      const expected = 'Visit https:&#x2F;&#x2F;example.com?param=&quot;value&quot;&amp;other=&lt;data&gt;'
      expect(sanitizeString(input, 'htmlEntity')).toBe(expected)
    })

    context('edge cases', () => {
      it('handles empty string', () => {
        expect(sanitizeString('', 'htmlEntity')).toBe('')
      })

      it('handles null and undefined', () => {
        expect(sanitizeString(null, 'htmlEntity')).toBeNull()
        expect(sanitizeString(undefined, 'htmlEntity')).toBeUndefined()
      })

      it('handles string with only safe characters', () => {
        const input = 'This is perfectly safe text with numbers 123 and symbols !@#$%^*()'
        expect(sanitizeString(input, 'htmlEntity')).toBe(input)
      })

      it('handles repeated dangerous characters', () => {
        const input = '<<>>&&&"""'
        const expected = '&lt;&lt;&gt;&gt;&amp;&amp;&amp;&quot;&quot;&quot;'
        expect(sanitizeString(input, 'htmlEntity')).toBe(expected)
      })
    })

    context('JSON serialization compatibility', () => {
      it('maintains HTML entities through JSON.stringify and JSON.parse', () => {
        const input = '<script>alert("test")</script>'
        const sanitized = sanitizeString(input, 'htmlEntity')
        const jsonString = JSON.stringify({ content: sanitized })
        const parsed = JSON.parse(jsonString)

        expect(parsed.content).toBe('&lt;script&gt;alert(&quot;test&quot;)&lt;&#x2F;script&gt;')
        expect(parsed.content).not.toContain('<')
        expect(parsed.content).not.toContain('>')
        expect(parsed.content).not.toContain('"')
      })

      it('works with complex objects that get JSONified', () => {
        const data = {
          title: 'Article <title>',
          content: 'Content with "quotes" & <tags>',
          metadata: {
            author: "O'Reilly & Associates",
          },
        }

        const sanitized = {
          title: sanitizeString(data.title, 'htmlEntity'),
          content: sanitizeString(data.content, 'htmlEntity'),
          metadata: {
            author: sanitizeString(data.metadata.author, 'htmlEntity'),
          },
        }

        const jsonString = JSON.stringify(sanitized)
        const parsed = JSON.parse(jsonString)

        expect(parsed.title).toBe('Article &lt;title&gt;')
        expect(parsed.content).toBe('Content with &quot;quotes&quot; &amp; &lt;tags&gt;')
        expect(parsed.metadata.author).toBe('O&#x27;Reilly &amp; Associates')
      })
    })

    context('Unicode character preservation', () => {
      it('preserves existing Unicode characters while sanitizing HTML', () => {
        const input = 'Hello 世界 & <test>'
        const expected = 'Hello 世界 &amp; &lt;test&gt;'
        expect(sanitizeString(input, 'htmlEntity')).toBe(expected)
      })

      it('preserves emojis and special Unicode while sanitizing HTML', () => {
        const input = '🚀 Launch <rocket> "soon"!'
        const expected = '🚀 Launch &lt;rocket&gt; &quot;soon&quot;!'
        expect(sanitizeString(input, 'htmlEntity')).toBe(expected)
      })
    })

    context('real-world attack vectors', () => {
      it('sanitizes data URIs', () => {
        const input = '<img src="data:text/html,<script>alert(1)</script>">'
        const result = sanitizeString(input, 'htmlEntity')
        expect(result).not.toContain('<script>')
        expect(result).toContain('&lt;script&gt;')
      })

      it('sanitizes JavaScript URIs', () => {
        const input = '<a href="javascript:alert(\'xss\')">Click</a>'
        const result = sanitizeString(input, 'htmlEntity')
        expect(result).not.toContain('<a')
        expect(result).not.toContain("'")
        expect(result).toContain('&lt;a')
        expect(result).toContain('&#x27;')
      })

      it('sanitizes CSS expression injection', () => {
        const input = '<div style="background:url(\'javascript:alert(1)\')">Content</div>'
        const result = sanitizeString(input, 'htmlEntity')
        expect(result).not.toContain('<div')
        expect(result).not.toContain("'")
        expect(result).toContain('&lt;div')
        expect(result).toContain('&#x27;')
      })
    })

    context('when used with template rendering', () => {
      it('produces safe output that displays correctly when rendered in HTML', () => {
        const userInput = 'User said: <script>alert("hack")</script>'
        const sanitized = sanitizeString(userInput, 'htmlEntity')

        // When this gets rendered in HTML, it will display as:
        // "User said: <script>alert("hack")</script>"
        // But won't execute as code because it's entity-encoded
        expect(sanitized).toBe('User said: &lt;script&gt;alert(&quot;hack&quot;)&lt;&#x2F;script&gt;')
      })
    })

    context('performance with large strings', () => {
      it('handles large strings efficiently', () => {
        const dangerousChar = '<script>alert("xss")</script>'
        const largeInput = dangerousChar.repeat(1000)
        const result = sanitizeString(largeInput, 'htmlEntity')

        expect(result).not.toContain('<script>')
        expect(result).not.toContain('"')
        expect(result).toContain('&lt;script&gt;')
        expect(result).toContain('&quot;')
        expect(result.length).toBeGreaterThan(0)
      })
    })
  })
})
