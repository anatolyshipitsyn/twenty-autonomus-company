import { definePageLayout, PageLayoutTabLayoutMode, PageLayoutType } from 'twenty-sdk/define';

export default definePageLayout({
  universalIdentifier: '875f864d-7e4d-44c3-9a1c-5346326e3c1f',
  name: 'Default AI Run Layout',
  type: PageLayoutType.RECORD_PAGE,
  objectUniversalIdentifier: '318342d0-6860-4b32-bc33-dc615100d9bd',
  tabs: [
    {
      universalIdentifier: '59400fa1-f29f-40d1-9050-5d2ad5ba0c19',
      title: 'Home',
      position: 10,
      icon: 'IconHome',
      layoutMode: PageLayoutTabLayoutMode.VERTICAL_LIST,
      widgets: [
        {
          universalIdentifier: '1a58e1c0-23e0-4df9-9fcb-6276437fc777',
          title: 'Fields',
          type: 'FIELDS',
          configuration: {
            configurationType: 'FIELDS',
            viewUniversalIdentifier: 'f1f17d7b-76a4-43c8-bd79-2ff90677faf7',
          },
        },
      ],
    },
    {
      universalIdentifier: '0f8d3755-df6c-498e-a7de-061b830f42c6',
      title: 'Timeline',
      position: 20,
      icon: 'IconTimelineEvent',
      layoutMode: PageLayoutTabLayoutMode.VERTICAL_LIST,
      widgets: [
        {
          universalIdentifier: 'a2333477-ca21-47c6-8e4d-f8e791166af2',
          title: 'Timeline',
          type: 'TIMELINE',
          configuration: {
            configurationType: 'TIMELINE',
          },
        },
      ],
    },
  ],
});
