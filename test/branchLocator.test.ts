import { assert } from 'chai';

import { decodeBranchLocator, encodeBranchLocator } from '../src';

const shouldPass = [
  {
    bl: '',
    printWildcards: false,
    branch: {
    }
  },
  {
    bl: '-::-|-@-:-',
    printWildcards: true,
    branch: {
    }
  },
  {
    bl: 'namespaceSegment::pathSegment|projectSegment@organizationSegment:versionSegment',
    branch: {
      namespaceSegment: 'namespaceSegment',
      pathSegment: 'pathSegment',
      projectSegment: 'projectSegment',
      organizationSegment: 'organizationSegment',
      versionSegment: 'versionSegment'
    }
  }, {
    bl:
      'example::product|forms@openCanna',
    branch: {
      namespaceSegment: 'example',
      pathSegment: 'product',
      projectSegment: 'forms',
      organizationSegment: 'openCanna'
    }
  },
  {
    bl: 'simple@chroma',
    branch: {
      pathSegment: 'simple',
      organizationSegment: 'chroma'
    }
  },
  {
    bl: 'multiVersion@chroma:3:2:1',
    branch: {
      pathSegment: 'multiVersion',
      organizationSegment: 'chroma',
      versionSegment: '3',
      versionSegments: ['3', '2', '1']
    }
  },
  {
    bl: 'multiOrg@chroma@openCanna',
    branch: {
      pathSegment: 'multiOrg',
      organizationSegment: 'chroma',
      organizationSegments: ['chroma', 'openCanna'],
    }
  },
  {
    bl: 'multiMulti|projectA|projectB@org1@org2:3:2:1',
    branch: {
      pathSegment: 'multiMulti',
      projectSegment: 'projectA',
      projectSegments: ['projectA', 'projectB'],
      organizationSegment: 'org1',
      organizationSegments: ['org1', 'org2'],
      versionSegment: '3',
      versionSegments: ['3', '2', '1']
    }
  },
  {
    bl: 'product2@3m',
    branch: {
      pathSegment: 'product2',
      organizationSegment: '3m',
    }
  },
  {
    bl: 'has space|has/slash@has-hyphen',
    branch: {
      pathSegment: 'has space',
      projectSegment: 'has/slash',
      organizationSegment: 'has-hyphen',
    }
  }
]

const shouldFail = [
  '.@no_dot',
  '+@no_plus',
  'l77t@noNumbersInTheMiddle',
  '-no-leadingDash@org',
  'no-trailing-dash-@org',
];

describe('Branch locator', () => {
  for (const { bl, branch, printWildcards } of shouldPass) {
    it(bl, () => {
      const result = decodeBranchLocator(bl);
      assert.deepEqual(result, branch as any);
      const reEncodedBl = encodeBranchLocator(result, { includeNamespaceSegment: true, printWildcards });
      assert.equal(reEncodedBl, bl, 're-encode failed');
    });
  }

  for (const bl of shouldFail) {
    it(bl, () => {
      let result;
      try {
        result = decodeBranchLocator(bl);
      } catch (e) {
      };
      if (result) {
        console.log(result)
        assert(0, `${bl} should have failed`)
      }
    });
  }
});
