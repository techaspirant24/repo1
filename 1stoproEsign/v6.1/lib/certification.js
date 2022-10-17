var data = {};

function downloadCertification() {
    document.getElementById('responseTxt').innerHTML = 'Completion Certifiaction is in Progress.. Please wait.';
    document.getElementById("responseTxt").style.color = 'black';
    console.log(data['pageLoadData']['EntityId'][0]);
    var record_Id = data['pageLoadData']['EntityId'][0];
    var entity_Name = data['pageLoadData']['Entity'];
    ZOHO.CRM.API.getRecord({ Entity: entity_Name, RecordID: record_Id })
        .then(function (data) {
            console.log(data);
            var requestId = data['data']['0']['Sign_Request_ID'];
            if (data['data']['0']['Document_Status'] == "COMPLETED") {
                ZOHO.CRM.CONNECTOR.invokeAPI("zohosign.getcompcert", { "request_id": requestId, RESPONSE_TYPE: "stream" })
                    .then(function (data) {

                        console.log(data);
                        ZOHO.CRM.API.attachFile({
                            Entity: entity_Name,
                            RecordID: record_Id,
                            File: {
                                Name: 'Completion_Certificate.pdf',
                                Content: data
                            }
                        }).then(function (result) {
                            console.log("Gowtham..!");
                            console.log(result);
                            if (result['data'][0]['code'] == 'SUCCESS') {
                                document.getElementById('loader').style.display = 'none';
                                document.getElementById('responseTxt').innerHTML = 'Completion Certifiaction has been downloaded successfully..';
                                document.getElementById("responseTxt").style.color = '#028D5E';

                                // alert('Completion Certifiaction has been downloaded successfully..');
                                setTimeout(() => {
                                    ZOHO.CRM.UI.Popup.closeReload()
                                        .then(function (data) {
                                            console.log(data)
                                        })
                                }, 10000);
                              
                            }
                        });
                    })
            } else {
                // alert('Please complete the document before downloading the certificate..');
                document.getElementById('loader').style.display = 'none';

                document.getElementById('responseTxt').innerHTML = 'Please complete the document before downloading the certificate..';
                document.getElementById("responseTxt").style.color = 'red';
                setTimeout(() => {
                    ZOHO.CRM.UI.Popup.closeReload()
                        .then(function (data) {
                            console.log(data)
                        })
                }, 10000);

            }

        })

}
