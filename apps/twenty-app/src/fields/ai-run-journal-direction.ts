import { defineField, FieldType } from 'twenty-sdk/define';

export default defineField({
  universalIdentifier: '48de2ae7-5ba9-43e7-a384-97be18cd1c8e',
  name: 'direction',
  label: 'Direction',
  type: FieldType.SELECT,
  objectUniversalIdentifier: '33dc6563-3c21-4f10-953b-27a2b9189b85',
  options: [
    { position: 0, label: 'Outbound', value: 'OUTBOUND', color: 'blue' },
    { position: 1, label: 'Inbound', value: 'INBOUND', color: 'green' },
  ],
});
