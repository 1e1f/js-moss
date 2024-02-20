import { assert } from 'chai';

import { decodeBranchLocator, encodeBranchLocator, filterBranch, filterBranchName, hydrateBranchLocator, stringifyBranchLocator } from '../src';

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
    informalBl: 'Has Space_underscore@has-hyphen~has/slash',
    canonicalBl: 'hasspaceunderscore@hashyphen~has/slash',
    branch: {
      nameSegment: 'Has Space_underscore',
      projectSegment: 'has/slash',
      organizationSegment: 'has-hyphen',
    }
  },
  {
    informalBl: 'main@QA~test',
    canonicalBl: 'main@qa~test',
    branch: {
      nameSegment: 'main',
      projectSegment: 'test',
      organizationSegment: 'QA',
    }
  },
  {
    informalBl: '8675309/Dreamt Sleep Pen@dreamt~batches',
    canonicalBl: '8675309/dreamtsleeppen@dreamt~batches',
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
  'no leading underscore@_fail',
  // 'no trailing dash in project@org~fail-',
];

describe('Branch locator', () => {
  for (const { informalBl: expectInformalBl, canonicalBl: expectedBl, branch } of shouldPass) {
    it(expectInformalBl, () => {
      const informalBl = stringifyBranchLocator(branch as any);
      // console.log('informal:', informalBl);
      const decodedInformal = hydrateBranchLocator(informalBl);
      // console.log("hydrated", decodedInformal, informalBl, 'expect', expectInformalBl, 'orig:', branch)
      const generatedBl = encodeBranchLocator(branch as any, { includeNamespaceSegment: true });
      assert.deepEqual(generatedBl, expectInformalBl, "raw bl doens't match");
      const filteredName = filterBranchName(branch.nameSegment);
      // console.log(filteredName);
      assert.deepEqual(branch.nameSegment, filteredName), "test name contains non-ignored special chars";
      assert.deepEqual(branch.nameSegment, decodedInformal.nameSegment), "test name contains non-ignored special chars";
      if (generatedBl) {
        const canonicalBranch = decodeBranchLocator(generatedBl);
        const canonicalBl = encodeBranchLocator(canonicalBranch, { includeNamespaceSegment: true });
        assert.equal(canonicalBl, expectedBl || expectInformalBl.toLowerCase().replace(/ /g, ''), 're-encode failed');
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
        // console.log({ result, bl })
        assert(0, `${bl} should have failed`)
      }
    });
  }
});
