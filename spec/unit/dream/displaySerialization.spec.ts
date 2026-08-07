import { RecursiveSerializerInfo } from '../../../src/types/recursiveSerialization.js'
import Balloon from '../../../test-app/app/models/Balloon.js'
import BalloonLine from '../../../test-app/app/models/BalloonLine.js'
import PolymorphicTask from '../../../test-app/app/models/Polymorphic/Task.js'

/**
 * `displaySerialization` is what `psy i:serialization` calls (src/cli/index.ts:675), and its
 * printed output is the whole point of that command, so these examples assert the printed lines
 * and not only the returned RecursiveSerializerInfo (which the CLI discards).
 */
function captureSerializationDisplay(callback: () => RecursiveSerializerInfo): {
  lines: string[]
  serializationMap: RecursiveSerializerInfo
} {
  const lines: string[] = []
  const spy = vi.spyOn(console, 'log').mockImplementation((line: string) => {
    // yoctocolors no-ops when stdout is not a TTY, but strip escapes anyway so these assertions do
    // not depend on how the suite is invoked
    // eslint-disable-next-line no-control-regex
    lines.push(line.replace(/\[\d+m/g, ''))
  })

  try {
    return { lines, serializationMap: callback() }
  } finally {
    spy.mockRestore()
  }
}

describe('Dream.displaySerialization', () => {
  context('when the model is an STI base whose children register different serializers', () => {
    it('displays the union across every child, matching what preloadFor loads', () => {
      const { lines } = captureSerializationDisplay(() => Balloon['displaySerialization']('stiUnion'))

      expect(lines).toEqual([
        'Balloon',
        // every child's serializer is named, since the tree below is the union of all of them.
        // Printing a single child's globalName under the base's own name misattributed the tree.
        'Balloon/StiUnionAnimalSerializer',
        'Balloon/StiUnionLatexSerializer',
        'Balloon/StiUnionMylarSerializer',

        // rendered identically by all three children, so it prints once
        '└─── rendersMany sandbags',
        '     SandbagSerializer',

        // rendered by Balloon/StiUnionMylarSerializer only. Balloon/StiUnionAnimalSerializer
        // reaches the same association through a delegatedAttribute, which is never printed, and
        // which must not suppress Mylar's nested tree
        '└─── rendersOne balloonLine',
        '     BalloonLineSerializer',
        // BalloonLineSerializer renders `balloon`, an STI base, so one line per child serializer
        '     └─── rendersOne balloon',
        '          Balloon/Latex/AnimalSerializer',
        '     └─── rendersOne balloon',
        '          Balloon/LatexSerializer',
        '     └─── rendersOne balloon',
        '          Balloon/MylarSerializer',

        // rendered by Balloon/StiUnionLatexSerializer only, and invisible before 2.23.0: this
        // command walked the alphabetically-first child (Animal) and nothing else, while
        // `preloadFor` genuinely preloads it (spec/unit/query/preloadFor.spec.ts)
        '└─── rendersMany heartRatings',
        '     ExtraRating/HeartRatingSerializer',
      ])
    })

    it('prints an association every child renders exactly once', () => {
      const { lines } = captureSerializationDisplay(() => Balloon['displaySerialization']('stiUnion'))

      expect(lines.filter(line => line.includes('sandbags'))).toEqual(['└─── rendersMany sandbags'])
    })

    it('never prints delegated attributes', () => {
      const { lines } = captureSerializationDisplay(() => Balloon['displaySerialization']('stiUnion'))

      expect(lines.filter(line => line.includes('delegatedAttribute'))).toEqual([])
    })

    it('returns the union, with one child’s delegatedAttribute not clobbering another’s nested tree', () => {
      // the CLI discards the return value (src/cli/index.ts:675), so only a spec can pin it
      const { serializationMap } = captureSerializationDisplay(() =>
        Balloon['displaySerialization']('stiUnion')
      )

      expect(serializationMap).toEqual({
        sandbags: { parentDreamClass: Balloon, nestedSerializerInfo: {} },
        balloonLine: {
          parentDreamClass: Balloon,
          nestedSerializerInfo: {
            balloon: { parentDreamClass: BalloonLine, nestedSerializerInfo: {} },
          },
        },
        heartRatings: { parentDreamClass: Balloon, nestedSerializerInfo: {} },
      } satisfies RecursiveSerializerInfo)
    })
  })

  context('with a polymorphic association', () => {
    it('prints one line per target class', () => {
      const { lines } = captureSerializationDisplay(() => PolymorphicTask['displaySerialization']())

      // a single `taskable` edge legitimately targets both Chore and Workout, so collapsing on
      // association name alone would silently drop one of them
      expect(lines).toEqual([
        'PolymorphicTask',
        'Polymorphic/TaskSerializer',
        '└─── rendersOne taskable',
        '     Polymorphic/ChoreSerializer',
        '     └─── rendersMany cleaningSupplies',
        '          Polymorphic/CleaningSupplySerializer',
        '└─── rendersOne taskable',
        '     Polymorphic/WorkoutSerializer',
        '     └─── rendersOne workoutType',
        '          Polymorphic/WorkouttypeSerializer',
      ])
    })
  })
})
