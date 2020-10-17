import { assert } from 'chai';

import { decodeBranchLocator, encodeBranchLocator } from '../src';

const shouldPass = [
  {
    bl: '',
    branch: {
    }
  },
  {
    bl: '-::-@-~-:-',
    branch: {
      contextSegment: '-',
      nameSegment: '-',
      projectSegment: '-',
      organizationSegment: '-',
      versionSegment: '-',
    }
  },
  {
    bl: 'contextSegment::nameSegment@organizationSegment~projectSegment:versionSegment',
    branch: {
      contextSegment: 'contextSegment',
      nameSegment: 'nameSegment',
      projectSegment: 'projectSegment',
      organizationSegment: 'organizationSegment',
      versionSegment: 'versionSegment'
    }
  }, {
    bl:
      'example::product@openCanna~forms',
    branch: {
      contextSegment: 'example',
      nameSegment: 'product',
      projectSegment: 'forms',
      organizationSegment: 'openCanna'
    }
  },
  {
    bl: 'simple@chroma',
    branch: {
      nameSegment: 'simple',
      organizationSegment: 'chroma'
    }
  },
  {
    bl: 'multiVersion@chroma:3:2:1',
    branch: {
      nameSegment: 'multiVersion',
      organizationSegment: 'chroma',
      versionSegment: '3',
      versionSegments: ['3', '2', '1']
    }
  },
  {
    bl: 'multiOrg@chroma@openCanna',
    branch: {
      nameSegment: 'multiOrg',
      organizationSegment: 'chroma',
      organizationSegments: ['chroma', 'openCanna'],
    }
  },
  {
    bl: 'multiMulti@org1@org2~projectA~projectB:3:2:1',
    branch: {
      nameSegment: 'multiMulti',
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
      nameSegment: 'product2',
      organizationSegment: '3m',
    }
  },
  {
    bl: 'has space @ has-hyphen ~ has/slash',
    match: 'has space@has-hyphen~has/slash',
    branch: {
      nameSegment: 'has space',
      projectSegment: 'has/slash',
      organizationSegment: 'has-hyphen',
    }
  }
]

const shouldFail = [
  'no dot@.',
  'no plus@+',
  'no numbers inside word@l77t',
  'no leading dash@-fail',
  'no trailing dash@fail-',
];

describe('Branch locator', () => {
  for (const { bl, branch, match } of shouldPass) {
    it(bl, () => {
      const result = decodeBranchLocator(bl);
      assert.deepEqual(result, branch as any);

      const reEncodedBl = encodeBranchLocator(result, { includeNamespaceSegment: true });
      assert.equal(reEncodedBl, match || bl, 're-encode failed');
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
        console.log({ result, bl })
        assert(0, `${bl} should have failed`)
      }
    });
  }
});
