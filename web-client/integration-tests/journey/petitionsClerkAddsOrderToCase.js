export default test => {
  return it('Petitions clerk adds Order to case', async () => {
    await test.runSequence('openCreateMessageModalSequence');

    await test.runSequence('submitCreateOrderModalSequence');

    expect(test.getState('validationErrors')).toEqual({
      documentTitle: 'Order title is required.',
      documentType: 'Order type is required.',
      eventCode: 'Order type is required.',
    });

    await test.runSequence('updateCreateOrderModalFormValueSequence', {
      key: 'eventCode',
      value: 'ODD',
    });

    expect(test.getState('form.documentType')).toEqual(
      'Order of Dismissal and Decision',
    );

    await test.runSequence('submitCreateOrderModalSequence');

    expect(test.getState('validationErrors')).toEqual({});

    await test.runSequence('updateFormValueSequence', {
      key: 'richText',
      value: '<p>This is a test order.</p>',
    });

    await test.runSequence('submitCourtIssuedOrderSequence');

    expect(test.getState('validationErrors')).toEqual({});
    expect(test.getState('pdfPreviewUrl')).toBeDefined();
    expect(test.getState('form.primaryDocumentFile')).toBeDefined();
  });
};