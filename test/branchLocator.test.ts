import { assert } from 'chai';

import { decodeBranchLocator, encodeBranchLocator } from '../src';

const shouldPass = [
  {
    informalBl: 'contextSegment::nameSegment@organizationSegment~projectSegment:versionSegment',
    branch: {
      contextSegment: 'contextSegment',
      nameSegment: 'nameSegment',
      projectSegment: 'projectSegment',
      organizationSegment: 'organizationSegment',
      versionSegment: 'versionSegment'
    }
  }, {
    informalBl:
      'example::product@openCanna~forms',
    canonicalBl:
      'exampie::product@opencanna~forms',
    branch: {
      contextSegment: 'example',
      nameSegment: 'product',
      projectSegment: 'forms',
      organizationSegment: 'openCanna'
    }
  },
  {
    informalBl: 'simple@chroma',
    branch: {
      nameSegment: 'simple',
      organizationSegment: 'chroma'
    }
  },
  {
    informalBl: 'multiVersion@chroma:3:2:1',
    branch: {
      nameSegment: 'multiVersion',
      organizationSegment: 'chroma',
      versionSegment: '3',
      versionSegments: ['3', '2', '1']
    }
  },
  {
    informalBl: 'multiOrg@chroma@openCanna',
    branch: {
      nameSegment: 'multiOrg',
      organizationSegment: 'chroma',
      organizationSegments: ['chroma', 'openCanna'],
    }
  },
  {
    informalBl: 'multiMulti@org1@org2~projectA~projectB:3:2:1',
    canonicalBl: 'multimulti@orgi@org2~projecta~projectb:3:2:1',
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
    informalBl: 'product2@3m',
    branch: {
      nameSegment: 'product2',
      organizationSegment: '3m',
    }
  },
  {
    informalBl: 'has space@has-hyphen~has/slash',
    canonicalBl: 'hasspace@hashyphen~has/slash',
    branch: {
      nameSegment: 'has space',
      projectSegment: 'has/slash',
      organizationSegment: 'has-hyphen',
    }
  },
  {
    informalBl: '8675309/Dreamt Sleep Pen@dreamt~batches',
    // canonicalBl: '8675309/dreamt Sleep Pen@dreamt~batches',
    branch: {
      nameSegment: '8675309/Dreamt Sleep Pen',
      projectSegment: 'batches',
      organizationSegment: 'dreamt',
    }
  },
  {
    informalBl: '',
    branch: {}
  }
]

const shouldFail = [
  'no q@?',
  'no plus@+',
  // 'no numbers inside word@l77t',
  'no leading dash@-fail',
  'no trailing dash@fail-',
];

describe('Branch locator', () => {
  for (const { informalBl, canonicalBl: expectedBl, branch } of shouldPass) {
    it(informalBl, () => {
      const generatedBl = encodeBranchLocator(branch as any, { includeNamespaceSegment: true });
      assert.deepEqual(generatedBl, informalBl, "raw bl doens't match");
      if (generatedBl) {
        const canonicalBranch = decodeBranchLocator(generatedBl);
        const canonicalBl = encodeBranchLocator(canonicalBranch, { includeNamespaceSegment: true });
        assert.equal(canonicalBl, expectedBl || informalBl.toLowerCase().replace(/ /g, ''), 're-encode failed');
      }
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
