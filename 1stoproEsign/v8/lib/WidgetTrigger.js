var data = {};
var Utils = {};
var userArray = [];
var zsignUserArray = [];
var switchVar = 0;
var uploadFile = false;
var hostNameisNone = false;
//var updateDataGenerator = {};
var mmFiles = false;
var attachmentsFiles = false;
var fileLen = [];
var userLicenceDetailResponse;
var attachmentsFileArray = [];

var fileNames = [];
var newAttachment = [];
var moduleToFieldMap = {
    "Contacts": [
        "id",
        "Full_Name",
        "Email"
    ]
};
var userToFieldMap = {
    "Users": [
        "id",
        "full_name",
        "email"
    ]
};
var zsUserToFieldMap = {
    "users": [
        "user_id",
        "user_name",
        "user_email"
    ]
}
var zApiKey;
var secondaryRecordsData = {};
var copySecondaryRecordsData = [];
var rowCounter = 0;
var customModuleNameToDetailMapping = {};
var zohoSignDocument, zohoSignRecipients, zohoSignDocumentsEvents;
var recipients = {};
var timeout = null;
var globalCallBackUrl;
var fileStream;
var authToken;
var DocsAuthToken = "";
var zsoid = "";
var fileName = "";
var templateId = "";
var templateNewId = "";
var templateNewText = "";
var configData = {};
var lookupRecData = {};
var orgResp = {};
var vcrmCompName;
var countryCode = [];
var modals = document.getElementById("myModal");
var spans = document.getElementsByClassName("close")[0];
var totalAttachments = [];
$(document).click(function (e) {
    console.log(e.target);
    var curClass = e.target.getAttribute("id");

    var emailRows = $.find("[id*='emailRecip']")
    for (i = 0; i < emailRows.length; i++) {
        //var curRow = emailRows[i].id;
        //isHidden = $("#"+curRow).css("display");
        displayVal = $(emailRows[i]).css("display");
        if (displayVal != "none") {
            var container = jQuery(emailRows[i]);
            if (!container.is(e.target) && container.has(e.target).length === 0) {
                //var emailVal = $("#recipientMail").val();
                var emailDiv = $(container).find("[id*='recipientMail']");
                var emailVal = $(emailDiv).val();
                var errorDiv = $(container).find("[id*='error-message']")
                if (emailVal != "") {
                    if (!validateEmail(emailVal)) {

                        $(errorDiv).show();

                    } else {

                        $(errorDiv).hide();
                    }
                }

            }
        }
    }
});
function validateEmail(email) {
    const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}

function initZohoSign() {

    $("#DetailpageLoad").show();
    ZOHO.CRM.CONNECTOR.isConnectorAuthorized("zohosign").then(function (result)   // VerticalInventory Connector 
    {
        if (result == "false") {

            ZOHO.CRM.CONNECTOR.authorize("zohosign").then(function (result) {
                loadSignPage();
            }, function (err) {
                console.log("ERRORRRRRRR");
                console.log(err);
                $("#auth").show();
                $(".btnbg").hide();
                $("#zhosingIN").hide();
                $("#DetailpageLoad").hide();
                $("#auth").text("Please contact your Administrator to Access Send for Sign");
            });

        } else {
            loadSignPage();
        }
    });

}
function loadSignPage() {
    disableLoader();
    $.getJSON("../lib/countryCode.json", function (result) {
        const
            listOfTags = result,
            keys = ['recipient_countrycode'],
            filtered = listOfTags.filter(
                (s => o =>
                    (k => !s.has(k) && s.add(k))
                        (keys.map(k => o[k]).join('|'))
                )
                    (new Set)
            );

        console.log(filtered);
        filtered.sort(function(a, b) {
            return parseInt(a['recipient_countrycode']) - parseInt(b['recipient_countrycode']);
          });
        countryCode = filtered;
        console.log(countryCode);
    });
    $.getJSON("../lib/config.json", function (result) {
        console.log(result);
        configData = result;
        console.log("Its Trigger!!");
        ZOHO.CRM.API.getAllUsers({ Type: "ActiveConfirmedUsers" })
            .then(function (data) {
                console.log(data);
                userArray = data.users;
            })
        ZOHO.CRM.CONNECTOR.invokeAPI(configData.connectorsApi.getHostsUsers, {})
            .then(function (result) {
                console.log("zsign user test:");
                console.log(result);
                var resp = JSON.parse(result.response);
                code = resp.code;
                if (code == 3001) {
                    $("#auth").show();
                    $(".btnbg").hide();
                    $("#zhosingIN").hide();
                    $("#DetailpageLoad").hide();
                    $("#auth").text("Sign Account does not exist! Please contact your Administrator to Access Send for Sign");
                }
                allHosts = resp.hosts;
                for (i = 0; i < allHosts.length; i++) {
                    //curUser = allHosts[i];
                    zsignUserArray.push(allHosts[i]);
                }
            });

        ZOHO.CRM.CONNECTOR.invokeAPI(configData.connectorsApi.getfields, {})
            .then(function (data) {
                console.log("Authorization Done!! ");
            }, function (err) {
                console.log("ERRORRRRRRR");
                if (err.code.startsWith("4") && err.message.toLowerCase().indexOf("auth") >= 0) {
                    $("#auth").show();
                    $(".btnbg").hide();
                    $("#zhosingIN").hide();
                    $("#DetailpageLoad").hide();
                } else {
                    $("#auth").hide();
                }
            })



        ZOHO.CRM.CONNECTOR.invokeAPI(configData.connectorsApi.getLicenseDetails, {}).then(function (licence) {
            console.log(licence);
            console.log("licence");
            if (licence['status_code'] == 200) {
                userLicenceDetailResponse = JSON.parse(licence['response']);
                console.log(userLicenceDetailResponse);
            }

        })

        ZOHO.CRM.CONNECTOR.invokeAPI(configData.connectorsApi.getCurrentUser, {}).then(function (user) {
            console.log(user);
            console.log("user");
            if (user['status_code'] == 200) {
                var response = JSON.parse(user['response']);
                console.log(response);
            }

        })





        Promise.all([ZOHO.CRM.META.getModules(), ZOHO.CRM.CONFIG.GetCurrentEnvironment()]).then(function (response) {

            ZOHO.CRM.CONFIG.getOrgInfo().then(function (orgVar) {
                console.log(orgVar);
                zsoid = orgVar.org[0].zgid;
                vcrmCompName = orgVar.org[0].company_name;
                ZOHO.CRM.CONNECTOR.invokeAPI(configData.connectorsApi.getOrgDetails, {})
                    .then(function (result) {
                        console.log(result);
                        var status_code = result.status_code;
                        if (status_code >= 200 && status_code < 300) {
                            orgResp = JSON.parse(result.response);
                            delete orgResp['code'];
                            delete orgResp['message'];
                            delete orgResp['status'];
                            console.log("orgResp");
                            orgName = orgResp.org_details.org_name;
                            if (vcrmCompName.toUpperCase() !== orgName.toUpperCase()) {
                                console.log("YES")
                                orgResp.org_details.org_name = vcrmCompName;
                                encodeOrgDetails = {};
                                encodeOrgDetails.data = encodeURIComponent(JSON.stringify(orgResp));
                                console.log("Before ENCODE::");
                                console.log(orgResp);
                                console.log("Afer ENCODE::");
                                console.log(encodeOrgDetails);
                                ZOHO.CRM.CONNECTOR.invokeAPI(configData.connectorsApi.updateOrgDetails, encodeOrgDetails)
                                    .then(function (result) {
                                        //alert("orgName Updated Successfully");
                                        console.log(result);
                                    });
                            }
                        }
                    });
                var settingmap = {};
                settingmap.settings = "settings";
                ZOHO.CRM.CONNECTOR.invokeAPI(configData.connectorsApi.getReminderSettings, settingmap)
                    .then(function (myres) {
                        console.log(myres);
                        console.log("my getsettins result ::");
                        var status_code = myres.status_code;
                        if (status_code >= 200 && status_code < 300) {
                            settingsResp = JSON.parse(myres.response);
                            remiderVal = settingsResp.settings.reminders_settings.email_reminders;
                            if (remiderVal) {
                                settingsResp.settings.reminders_settings.email_reminders = true;
                                var map = {};
                                map.settings = "settings";
                                map.data = {};
                                var j = { "settings": { "reminders_settings": { "email_reminders": false, "reminder_period": 15 }, "request_default": { "send_mail_from": 2, "authentication_offline": true, "send_completed_document_to": 0, "authentication_mandatory": false, "embed_document_id": true, "expiration_days": 15, "authentication_email": true, "is_sequential": true, "send_completed_document_as": 0, "embed_document_id_page_config": 0, "authentication_sms": true, "embed_document_id_position_config": 0, "add_in_blockchain": false, "send_completion_certificate_to": 1 } } }
                                map.data = encodeURIComponent(JSON.stringify(j));
                                ZOHO.CRM.CONNECTOR.invokeAPI(configData.connectorsApi.updateReminderSettings, map).then(function (myupdRes) {
                                    console.log("reminder is stopped!");
                                    console.log(myupdRes);
                                })
                            }
                        }
                    })
                ZOHO.CRM.CONNECTOR.invokeAPI(configData.connectorsApi.getMailTemplateStatus, {})
                    .then(function (result) {
                        console.log(result);
                        var status_code = result.status_code;
                        if (status_code >= 200 && status_code < 300) {
                            mailResp = JSON.parse(result.response);
                            console.log("mailResp");
                            console.log(mailResp);
                            isCustomEmailSet = mailResp.branding_settings.custom_email;
                            if (!isCustomEmailSet) {
                                delete mailResp['code'];
                                delete mailResp['message'];
                                delete mailResp['status'];
                                delete mailResp.branding_settings.logo_url;
                                mailResp.branding_settings.custom_email = true;
                                encodeTempDetails = {};
                                encodeTempDetails.data = encodeURIComponent(JSON.stringify(mailResp));
                                console.log("Before ENCODE::");
                                console.log(mailResp);
                                console.log("Afer ENCODE::");
                                console.log(encodeTempDetails);
                                ZOHO.CRM.CONNECTOR.invokeAPI(configData.connectorsApi.updateMailTemplate, encodeTempDetails)
                                    .then(function (result) {
                                        //alert("orgName Updated Successfully");
                                        console.log(result);
                                        modifyEmailTemplate();
                                    });
                            }
                            else {
                                modifyEmailTemplate();
                            }
                        }
                    });
            });
            if (switchVar == 0) {
                var modulesData = response[0].modules;
                generateModuleNameToDetailMapping(modulesData);
                if (data.pageLoadData.Entity.includes("Contacts") || data.pageLoadData.Entity.includes("Leads") || data.pageLoadData.Entity.includes("Quotes") || data.pageLoadData.Entity.includes("Purchase_Orders")) {
                    $("#DetailpageLoad").hide();
                    var value;
                    ZOHO.CRM.API.getRecord({ Entity: data.pageLoadData.Entity, RecordID: data.pageLoadData.EntityId[0] })
                        .then(function (datas) {
                            console.log(datas.data[0]);
                            //data.pageLoadData.recordDetail = recdetails;
                            if (data.pageLoadData.Entity.includes("Quotes") || data.pageLoadData.Entity.includes("Purchase_Orders")) {
                                ZOHO.CRM.API.getRecord({ Entity: 'Contacts', RecordID: datas.data[0].Contact_Name.id })
                                    .then(function (contacts) {
                                        console.log(contacts);
                                        lookupRecData = contacts.data[0];
                                        (data.pageLoadData.Entity.includes("Quotes") || data.pageLoadData.Entity.includes("Purchase_Orders")) == true ? value = "{" + contacts.data[0].Full_Name + "}" + contacts.data[0].Email : value = "{" + datas.data[0].Full_Name + "}" + datas.data[0].Email;
                                        addrecipient(undefined, 1, value);
                                    });
                            } else {
                                lookupRecData = datas.data[0];
                                value = "{" + datas.data[0].Full_Name + "}" + datas.data[0].Email;
                                addrecipient(undefined, 1, value);

                            }


                            // value = "{" + data.data[0].Full_Name + "}" + data.data[0].Email;
                        })

                } else if (data.pageLoadData.Entity.includes("Accounts")) {
                    $("#DetailpageLoad").hide();
                    var value;

                    ZOHO.CRM.API.getRelatedRecords({ Entity: data.pageLoadData.Entity, RecordID: data.pageLoadData.EntityId[0], RelatedList: "Contacts" })
                        .then(function (data) {
                            console.log(data, 'Accounts');
                            if (data['data'] != undefined) {
                                lookupRecData = data.data[0];
                                value = "{" + data.data[0].Full_Name + "}" + data.data[0].Email;
                                addrecipient(undefined, 1, value);
                            } else if (data['statusText'] != undefined && data['statusText'] == 'nocontent') {
                                value = "No Contact Found";
                                addrecipient(undefined, 1, value);
                            }

                        })
                } else if (data.pageLoadData.Entity.includes("Audits")) {
                    $("#DetailpageLoad").hide();
                } else if (data.pageLoadData.Entity.includes("Auditors")) {
                    $("#DetailpageLoad").hide();
                } else if (data.pageLoadData.Entity.includes("Auditor_Competencies")) {
                    $("#DetailpageLoad").hide();
                }
                else if (data.pageLoadData.Entity.includes("Deals") || data.pageLoadData.Entity.includes("Contract_Changes")) {
                    ZOHO.CRM.API.getRecord({ Entity: data.pageLoadData.Entity, RecordID: data.pageLoadData.EntityId[0] })
                        .then(function (data) {
                            $("#DetailpageLoad").hide();
                            recdetails = data.data[0];
                            //data.pageLoadData.recordDetail = recdetails;
                            recStatus = recdetails.Status;
                            if (recStatus == "Signed") {
                                $("#status").show();
                                $(".btnbg").hide();
                                $("#zhosingIN").hide();
                                return;
                            }
                            lookupRecData = recdetails;
                            Contact_Name = recdetails.Contact_Name;
                            if (Contact_Name == null || Contact_Name == undefined) {
                                value = "No Contact Found";
                                addrecipient(undefined, 1, value);
                            } else {
                                contactId = Contact_Name.id;
                                ZOHO.CRM.API.getRecord({ Entity: "Contacts", RecordID: contactId })
                                    .then(function (data) {
                                        value = "{" + data.data[0].Full_Name + "}" + data.data[0].Email;
                                        addrecipient(undefined, 1, value);
                                    });

                            }

                        })
                }
                if (response[1].appDetails != undefined) {
                    var appUrl = response[1].appDetails.url;
                    var appDomain = appUrl.split("//")[1].split(".")[0];
                    var protocol = appUrl.split(":")[0];
                    var simpleUrl = appUrl.split(":")[1];

                    protocol = protocol.substring(0, 4);
                    //appUrl = protocol+":"+simpleUrl;
                    appUrl = configData.customFunctions.appName;
                    ZOHO.CRM.CONNECTOR.invokeAPI("crm.zapikey", { "nameSpace": "vcrm_" + appDomain }).then(function (zApiKeyData) {
                        var tempZApiKeyResponse = JSON.parse(zApiKeyData);
                        if (tempZApiKeyResponse.response != "No key found") {
                            zApiKey = tempZApiKeyResponse.response;
                            //globalCallBackUrl = appUrl+"/crm/v2/settings/custom_functions/zohosigncallback/execute?zapikey="+zApiKey+"&useProxy=true";
                            globalCallBackUrl = appUrl + configData.customFunctions.callBackURL + zApiKey + "&useProxy=true";
                            //globalCallBackUrl = "http://eapp.localzohoplatform2.com/crm/v2/settings/custom_functions/zohosigncallback/execute?zapikey="+zApiKey+"&useProxy=true";
                        }
                        else {
                            zApiKey = undefined;
                            //globalCallBackUrl = appUrl+"crm/v2/functions/zohosigncallback/actions/execute?auth_type=apikey&zapikey=1001.ef4daa7f8346b09bcb6f572e01ff028c.4cf49461b458d9bb6faec01f1dfc43d1";
                            globalCallBackUrl = appUrl + "/crm/v2/functions/e360crm__zohosign_callbackfunction/actions/execute?auth_type=apikey&useProxy=true";
                            //globalCallBackUrl = "http://eapp.localzohoplatform2.com/crm/v2/settings/custom_functions/zohosigncallback/execute?useProxy=true";
                        }
                    });
                } else {
                    globalCallBackUrl = "https://realestatedemo.zohosandbox.com/crm/v2/functions/realestatedemo__zohosign_callbackfunction/actions/execute?auth_type=apikey&zapikey=1001.9e262feda3acbb2f7cb717d6d56dd8f5.945f58c6166bb5c7f8cbcb594ecdbb8c&useProxy=true"
                }
                switchVar = 1;
            }
        })
    })
}
var modal = document.getElementById("myModal");
function openModal() {
    document.getElementById("myModal").style.display = "block";
    var data = userLicenceDetailResponse['license_details']['documents_used'] + "/" + userLicenceDetailResponse['license_details']['no_of_documents'];
    document.getElementById("documentRemains").innerHTML = data;
}

window.onclick = function (event) {
    if (event.target == modal) {
        document.getElementById("myModal").style.display = "none";
    }
}



function closeModal() {
    document.getElementById("myModal").style.display = "none";
}

function modifyEmailTemplate() {
    var emailData = { "accounts": { "subject": "$SENDER_NAME$ from $ORG_NAME$ requests your signature", "mail_template": "<div class=\"container\" style=\"width: 100% !important; line-height: 1.6em; font-size: 14px; background-color: rgb(246, 246, 246); padding-top: 20px\"><table style=\"background-color: rgb(246, 246, 246); width: 600px; margin: 0 auto !important\"><tbody><tr><td><br></td><td style=\"display: block !important; width: 600px !important; margin: 0 auto !important; clear: both !important\" class=\"templateColumns\"><div style=\"margin: 0 auto; display: block\"><table style=\"background-color: rgb(255, 255, 255)\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\"><tbody><tr><td style=\"font-size: 16px; font-weight: 500; padding: 20px; line-height: 18px; background-color: rgb(255, 255, 255)\"><img src=\"$LOGO_URL$\" id=\"ztb-logo-rebrand\" style=\"max-height: 50px\"><br></td></tr><tr><td><table width=\"100%\" align=\"center\" cellpadding=\"10\" cellspacing=\"0\" style=\"background-color: rgb(81, 210, 182)\"><tbody><tr><td style=\"color: rgb(255, 255, 255); font-size: 16px; font-family: Helvetica, Arial, Sans Serif; border: none; background-color: rgb(81, 210, 182); padding: 20px; height: 28px\" class=\"header-row\"><div style=\"text-align: left; float: left; line-height: normal; padding: 0px 0 0 10px; display: inline-block; font-size: 24px; width: 100%\" class=\"sign-mail-header\">Digital Signature Request<br></div></td></tr></tbody></table></td></tr><tr><td style=\"padding: 25px 40px 0px 40px\"><table width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"padding-bottom: 20px\"><tbody style=\"font-size: 14px; color: rgb(68, 68, 68); line-height: 20px\"><tr><td style=\"padding: 0 0 20px; font-size: 14px\" class=\"message-row\"><div class=\"sign-mail-message\" style=\"word-wrap: break-word; width: 100%; float: left\"><span>$SENDER_NAME$ from $ORG_NAME$ has requested you to review and sign $DOCUMENT_NAME$</span><br></div></td></tr><tr><td><table style=\"width: 100%; table-layout: fixed\"><tbody><tr width=\"520px\" style=\"height: 30px; line-height: 30px; font-size: 14px\"><td width=\"35%\" style=\"font-weight: 600\">Sender<br></td><td style=\"width: 335px; text-overflow: ellipsis; overflow: hidden; white-space: nowrap\">$SENDER_EMAIL$<br></td></tr><tr width=\"520px\" style=\"height: 30px; line-height: 30px; font-size: 14px\"><td width=\"35%\" style=\"font-weight: 600\">Organization Name<br></td><td style=\"width: 335px; text-overflow: ellipsis; overflow: hidden; white-space: nowrap\">$ORG_NAME$<br></td></tr><tr width=\"520px\" style=\"height: 30px; line-height: 30px; font-size: 14px\"><td width=\"35%\" style=\"font-weight: 600\">Expires on<br></td><td style=\"width: 335px; text-overflow: ellipsis; overflow: hidden; white-space: nowrap\">$EXPIRY_DATE$<br></td></tr><tr width=\"520px\" style=\"height: 30px; line-height: 30px; font-size: 14px; vertical-align: top\"><td width=\"35%\" style=\"font-weight: 600\">Message to all<br></td><td>$NOTE$<br></td></tr></tbody></table></td></tr></tbody></table></td></tr><tr><td style=\"padding: 0 0 20px\"><table width=\"100%\"><tbody><tr><td align=\"center\" style=\"padding-top: 15px\"><div><table><tbody><tr><td align=\"center\" style=\"font-size: 15px; color: rgb(255, 255, 255); background-color: rgb(232, 78, 88); text-align: center; text-decoration: none; border-radius: 2px; display: inline-block; min-height: 38px\" class=\"button-row\"><a class=\"sign-mail-btn-link\" href=\"$LINK_TO_SIGN$\" style=\"font-size: 18px; color: rgb(255, 255, 255); text-align: center; text-decoration: none; border-radius: 3px; display: inline-block; padding: 0px 30px; float: left\" rel=\"noopener noreferrer\" target=\"_blank\"><div style=\"line-height: 38px; font-size: 18px\" class=\"sign-mail-btn-text\">Start Signing<br></div></a></td></tr></tbody></table></div></td></tr></tbody></table></td></tr></tbody></table></div></td><td><br></td></tr></tbody></table><div class=\"disclaimer-container\" style=\"background-color: #f6f6f6;width: 600px;padding: 10px 0px 20px 0px;margin: 0 auto;\">$FOOTER_CONTENT$</div></div><div><br></div><style type=\"text/css\">@media only screen and (max-width: 480px) {.templateColumns { width: 100% !important } }<br></style>", "file_name": "SIGN_MAIL_TEMPLATE", "language": "en" } };
    var encodeEmailData = {};
    encodeEmailData.data = encodeURIComponent(JSON.stringify(emailData));
    ZOHO.CRM.CONNECTOR.invokeAPI(configData.connectorsApi.updateEmailTemplate, encodeEmailData)
        .then(function (result) {
            //alert("email template Updated Successfully");
            console.log(result);
        });
}

/*function populateUserUI(response,rowNumber){
    //userToFieldMap
    $("#select_row_" + rowNumber).html('');
    copySecondaryRecordsData = userArray;
    populateUserSelect(rowNumber);

}*/
function populateUI(response, rowNumber) {
    secondaryRecordsData = {};
    copySecondaryRecordsData = {};
    $("#select_row_" + rowNumber).html('');
    secondaryRecordsData = response[1].data !== undefined ? response[1].data : {};
    if (response[0].data !== undefined) {
        if (jQuery.isEmptyObject(secondaryRecordsData)) {
            secondaryRecordsData = response[0].data;
        } else {
            secondaryRecordsData.concat(response[0].data);
        }
    }
    copySecondaryRecordsData = secondaryRecordsData.concat();
    populateSelect(rowNumber);
}

function generateModuleNameToDetailMapping(modulesData) {
    for (var _i = 0; _i < modulesData.length; _i++) {
        var currentModuleData = modulesData[_i];
        if (currentModuleData.module_name.toUpperCase().includes("CUSTOMMODULE")) {
            customModuleNameToDetailMapping[currentModuleData.module_name + "_" + currentModuleData.api_name + "1"] = currentModuleData;
        }
    }
}
function populateUserSelect(rowNumber) {
    $("#select_row_" + rowNumber).html('');
    var select = $("#select_row_" + rowNumber);
    var modName = userToFieldMap["Users"];
    var option = $('<option/>').attr({
        id: 'label_default',
        value: 'Choose Recipient'
    }).text('Choose Recipient').appendTo(select);

    for (var i = 0; i < copySecondaryRecordsData.length; i++) {
        option = $('<option/>').attr({
            id: 'label_' + copySecondaryRecordsData[i][modName[0]],
            value: "{" + copySecondaryRecordsData[i][modName[1]] + "} " + copySecondaryRecordsData[i][modName[2]]
        }).text("{" + copySecondaryRecordsData[i][modName[1]] + " } " + copySecondaryRecordsData[i][modName[2]]).appendTo(select);
    }
    var option = $('<option/>').attr({
        id: 'label_newRecipient',
        value: '+ New Recipient'
    }).text('+ New Recipient').appendTo(select);
    showSelectBOx();
}
function populate_zsUserSelect(rowNumber) {
    $("#select_row_" + rowNumber).html('');
    var select = $("#select_row_" + rowNumber);
    var modName = zsUserToFieldMap["users"];
    var option = $('<option/>').attr({
        id: 'label_default',
        value: 'Choose ZohoSign Recipient'
    }).text('Choose ZohoSign Recipient').appendTo(select);

    for (var i = 0; i < copySecondaryRecordsData.length; i++) {
        option = $('<option/>').attr({
            id: 'label_' + copySecondaryRecordsData[i][modName[0]],
            value: copySecondaryRecordsData[i][modName[1]] + "-" + copySecondaryRecordsData[i][modName[2]]
        }).text(copySecondaryRecordsData[i][modName[1]] + "-" + copySecondaryRecordsData[i][modName[2]]).appendTo(select);
    }
    showSelectBOx();
}
function populateSelect(rowNumber) {
    var select = $("#select_row_" + rowNumber);
    var moduleName = moduleToFieldMap["Contacts"];
    var option = $('<option/>').attr({
        id: 'label_default',
        value: 'Choose Recipient'
    }).text('Choose Recipient').appendTo(select);
    for (var _i = 0; _i < copySecondaryRecordsData.length; _i++) {
        option = $('<option/>').attr({
            id: 'label_' + copySecondaryRecordsData[_i][moduleName[0]],
            value: copySecondaryRecordsData[_i][moduleName[1]] + "-" + copySecondaryRecordsData[_i][moduleName[2]]
        }).text(copySecondaryRecordsData[_i][moduleName[1]] + "-" + copySecondaryRecordsData[_i][moduleName[2]]).appendTo(select);

    }
    showSelectBOx();
}

function checkHostName(data, rowCounters) {
    console.log(data.id);
    var currentRowNumber = data.id.split('_')[3];

    // var ids = 'select_zsuser_row_'+rowCounters;
    console.log(document.getElementById(data.id).value);
    if (document.getElementById(data.id).value != 'None') {
        document.getElementById('Host_' + currentRowNumber).innerText = 'Host (Mandatory)';
        document.getElementById('Host_' + currentRowNumber).style.color = "gray";
    }
    console.log(rowCounters);
    console.log("hidden");
}

function remove(currentRow) {
    $(currentRow).closest('tr').remove();
}
function addInperson(_this) {

    var val = $(_this).children(":selected").attr("id");
    var rowNumber = $(_this).attr("id").split("_")[2];
    if (val == 'INPERSONSIGN') {
        $("#hostDiv" + rowNumber).show();
        $("#SignerDiv" + rowNumber).show();
    } else {
        $("#hostDiv" + rowNumber).hide();
        $("#SignerDiv" + rowNumber).hide();
    }
}

function deliveryMode(_this) {
    var val = $(_this).children(":selected").attr("id");
    var rowNumber = $(_this).attr("id").split("_")[2];
    console.log(val);
    console.log(rowNumber);
    var a = 'countryCodeOption' + rowNumber;
    if (val == 'EMAIL_SMS') {
        console.log(countryCode);
        var value = `<div class="pSelect w200 noSearch">
         <span class="clr3"> Country Code <span style="color: red;">*</span> </span> 
         <select class="country" id="countryVal${rowNumber}" onchange="selectCountry(${rowCounter})"><option value="none">Select Code</option>`
        for (let i = 0; i < countryCode.length; i++) {
            value = value + `<option value="${countryCode[i]['recipient_countrycode']}">${countryCode[i]['recipient_countrycode']}</option>`;
        }
        value = value + `</select>  
        <span style="color: red;font-size: 13px;" id="requiredCountryCode${rowNumber}"></span>
       <div>
       <span class="clr3"> Phone Number <span style="color: red;">*</span></span>
       <input class="country" type="text" pattern="\d*" maxlength="10" id="phoneNumberVal${rowNumber}" placeholder="Enter Phonenumber">
       <span style="color: red;font-size: 13px;" id="requiredPhonenumber${rowNumber}"></span>
       <span style="color: red;font-size: 13px;" id="inValidPhonenumber${rowNumber}"></span>
      </div>
         </div>`;
        document.getElementById(a).style.display = 'block';
        document.getElementById(a).innerHTML = value;
    } else {
        document.getElementById(a).style.display = 'none';
    }
}

function selectCountry(rowNumber) {
    console.log(document.getElementById('countryVal' + rowNumber).value);
    if(document.getElementById('countryVal' + rowNumber).value != "none") {
        document.getElementById('requiredCountryCode' + rowNumber).innerText = '';
    }else {
        document.getElementById('requiredCountryCode' + rowNumber).innerText = 'Select the value of Country Code.';
    }
    
    
}

function addRecord(rowNumber, flag, value) {
    var tr = $("#tr_row_" + rowNumber);
    var select = $("#select_row_" + rowNumber);
    var signOrder = $("#signOrder_row_" + rowNumber);
    var signerRole = $("#signerRole_row_" + rowNumber);
    var removeBtn = $("#remove_row_" + rowNumber);
    var currentAddRecordCheckBoxId;
    var recipVal = $(select).children(":selected").text()

    if (flag == 0) {
        if (recipVal == "+ New Recipient") {
            //$("#recipientMail_"+rowNumber).show();
            $("#emailRecip_" + rowNumber).show();
            $("#div_pselect_row_" + rowNumber).hide();
            currentAddRecordCheckBoxId = rowNumber;
            //return;
        } else {
            currentAddRecordCheckBoxId = $(select).children(":selected").attr("id").split("_")[1];
        }
    }
    else {
        currentAddRecordCheckBoxId = data.pageLoadData.EntityId[0];
        $(select).children(":selected").val(value);
        $(select).children(":selected").text(value);
    }
    $(select).attr("disabled", "disabled");
    $(tr).attr("id", "tr_row_" + rowNumber + "_" + currentAddRecordCheckBoxId);
    $(select).attr("id", "select_row_" + rowNumber + "_" + currentAddRecordCheckBoxId);
    $(signOrder).attr("id", "signOrder_row_" + rowNumber + "_" + currentAddRecordCheckBoxId);
    $(signerRole).attr("id", "signerRole_row_" + rowNumber + "_" + currentAddRecordCheckBoxId);
    $(removeBtn).attr("id", "remove_row_" + rowNumber + "_" + currentAddRecordCheckBoxId);
    showSelectBOx();
}

function toggleSignOrder() {
    if ($('#signOrderCheckBox').is(':checked')) {
        $("input[id*='signOrder_row_']").removeAttr("disabled");
    } else {
        $("[id*='signOrder_row_']").attr("disabled", "disabled");
    }
    showSelectBOx();
}

function showSelectBOx() {
    $(".pSelect select").chosen({
        width: '100%'
    }); //No I18N
    $(".pSelect select").trigger("chosen:updated"); //No I18N
}

function addrecipient(obj, flag, value) {
    showSelectBOx();
    var tr = `<tr class="item" id="tr_row_${++rowCounter}"> <td class="itemName" id="td_row_${rowCounter}"> <div> <span id="SignerDiv${rowCounter}" style="display:none;margin-bottom: 10px;">Signer &gt;&gt;</span> <div id="emailRecip_${rowCounter}" style="display:none;"><input class="recipText" type="text" name="recipientMail" placeholder="Enter recipient email" id="recipientMail_${rowCounter}" /><div class="error-message" id="error-message_${rowCounter}"> <span class="error-text">* Invalid EmailId.</span></div><input class="recipText" type="text" name="recipientName" placeholder="Enter recipient name" id="recipientName_${rowCounter}" /></div> <div class="pSelect" id="div_pselect_row_${rowCounter}"> <select class="squer dropDownRecipients" id="select_row_${rowCounter}" name="recipients" onchange="addRecord(${rowCounter},0,undefined)"> <option>Search Recipient</option> <option>+ New Recipient</option> </select> </div> </div>   <div id="countryCodeOption${rowCounter}"  style="display: none;margin-top: 10px;"></div>  <div id="hostDiv${rowCounter}" style="display:none;margin-top: 10px;"> <span style="color:red;" id="Host_${rowCounter}">Host (Mandatory) &gt;&gt;</span><div><input type="hidden" id="input_${rowCounter}" name="hiddenText" value="None"/><select class="select_zsuser_row" id="select_zsuser_row_${rowCounter}" onchange="checkHostName(this,rowCounter)""><option value="None">--None--</option></select></div></div> </td> <td class="itemQty"> <div class="formInputBox pT0"><input class="textField" disabled="disabled" type="text" placeholder="Choose Order" id="signOrder_row_${rowCounter}" /></div> </td> <td class="itemPrice"> <div class="pSelect w200 noSearch"> <select class="primarySignerRole" id="signerRole_row_${rowCounter}" onchange="addInperson(this)"> <option id="sign" value="Sign" name="sign">Sign</option> <option id="view" value="View" name="View">View</option> <option id="INPERSONSIGN" value="INPERSONSIGN" name="INPERSONSIGN">In-person signer</option> </select> </div> </td>    <td class="itemPrice"> <div class="pSelect w200 noSearch"> <select class="primarySignerRole" id="signerDeliveryMode_row_${rowCounter}" onchange="deliveryMode(this)"> <option id="EMAIL" value="EMAIL" name="EMAIL">EMAIL</option> <option id="EMAIL_SMS" value="EMAIL_SMS" name="EMAIL_SMS">EMAIL & SMS</option>  </select> </div> </td>             <td class="pR oH"><a href="javascript:;" id="remove_row_${rowCounter}" onclick="remove(this)" class="remove">Remove</a></td></tr>`
    $('#addRec tbody').append(tr);
    if ($('#signOrderCheckBox').is(':checked')) {
        $("#signOrder_row_" + rowCounter).removeAttr("disabled");
    }
    if (flag) {
        addRecord(rowCounter, flag, value);
    }
    for (i = 0; i < zsignUserArray.length; i++) {
        $("#select_zsuser_row_" + rowCounter).append('<option value="' + zsignUserArray[i].email + ' {' + zsignUserArray[i].name + '">' + zsignUserArray[i].email + ' {' + zsignUserArray[i].name + '</option>');
    }
    showSelectBOx();
}

function getMetaData(name) {
    var keys = Object.keys(customModuleNameToDetailMapping);
    for (var _i = 0; _i < keys.length; _i++) {
        if (keys[_i].includes(name)) {
            return customModuleNameToDetailMapping[keys[_i]];
        }
    }
}

function toggleGIF() {
    $("#submit14").show();
    $("#loadingGif").hide();
}




async function uploadMultipleFilesWithoutMailMerge(fileLens, requestId, DocId) {

    for (var i = 0; i < fileLens.length; i++) {

        if (typeof fileLens[i]['size'] == 'number') {
            var fileName = fileLens[i];
            var secondFile = {
                "VARIABLES": {
                    "reqId": requestId
                },
                "CONTENT_TYPE": "multipart",
                "PARTS": [{
                    "headers": {
                        "Content-Disposition": "form-data; name=file; filename =" + fileName.name,
                        "Content-Type": "multipart/form-data; charset=ISO-8859-1",
                    },
                    "content": "__FILE__"
                }],
                "FILE": {
                    "fileParam": "content",
                    "file": fileName,
                }
            }
            let input = await new Promise(resolve => {
                ZOHO.CRM.CONNECTOR.invokeAPI(configData.connectorsApi.updateDocument, secondFile)
                    .then(function (gow) {
                        console.log(gow);
                        resolve(gow);
                    });
            });

        } else {
            fileLens[i]['Document_Id'] = DocId;
            fileLens[i]['requestId'] = requestId;
        }
    }

}

async function uploadMultipleFiles(fileLens, requestId) {

    for (var i = 1; i < fileLens.length; i++) {
        var fileName = fileLens[i];
        var secondFile = {
            "VARIABLES": {
                "reqId": requestId
            },
            "CONTENT_TYPE": "multipart",
            "PARTS": [{
                "headers": {
                    "Content-Disposition": "form-data; name=file; filename =" + fileName.name,
                    "Content-Type": "multipart/form-data; charset=ISO-8859-1",
                },
                "content": "__FILE__"
            }],
            "FILE": {
                "fileParam": "content",
                "file": fileName,
            }
        }
        let input = await new Promise(resolve => {
            ZOHO.CRM.CONNECTOR.invokeAPI(configData.connectorsApi.updateDocument, secondFile)
                .then(function (gow) {
                    console.log(gow);
                    resolve(gow);
                });
        });
    }

}

function enableLoader() {
    document.getElementById('loadingGif').style.display = "block";
}

function disableLoader() {
    document.getElementById('loadingGif').style.display = "none";
}

async function generateactionNew() {
    updateDataGenerator = {};
    var signOrderSet = 0;
    if ($('#signOrderCheckBox').is(':checked')) {
        signOrderSet = 1;
    }

    await generateActions(updateDataGenerator, signOrderSet);
}

async function newProcessForm() {
    uploadFile = false;
    mmFiles = false;
    window.scroll({
        top: 0,
        left: 0,
        behavior: 'smooth'
    });
    let datas = generateactionNew();
    if (hostNameisNone == false) {
        if ($('#docuName').val().length > 0) {
            $('#docuNameValidation').text('');
            var emailRows = $.find("[id*='emailRecip']")
            for (i = 0; i < emailRows.length; i++) {
                displayVal = $(emailRows[i]).css("display");
                if (displayVal != "none") {
                    var container = jQuery(emailRows[i]);
                    var errorDiv = $(container).find("[id*='error-message']")
                    var emailDiv = $(container).find("[id*='recipientMail']");
                    var emailVal = $(emailDiv).val();
                    if (emailVal != "") {
                        if (!validateEmail(emailVal)) {
                            alert("Invalid Entry. Kindly fill the form fully.");
                            toggleGIF();
                            disableLoader();
                            $(errorDiv).show();
                            return;
                        }
                    }
                }
            }

            fileLen.forEach(element => {
                if (typeof element['size'] == 'number') {
                    uploadFile = true;
                } else if (typeof element['size'] == 'undefined' && element['Name'] == undefined) {
                    mmFiles = true;
                } else if (typeof element['size'] == 'undefined' && element['Name'] !== undefined) {
                    attachmentsFiles = true;
                }
            });

            if (uploadFile && mmFiles && attachmentsFiles == false) {
                //both are present  
                $("#submit14").hide();
                $("#loadingGif").show();
                enableLoader();
                $("#Loading").show();
                $("#Loading").text("Processing Mail Merge Execution!");
                console.log("Uploading documents and MailMerge Templates...");
                module = data.pageLoadData.Entity;
                recordId = data.pageLoadData.EntityId[0];
                params = { "module": module, "recordId": recordId, "templateId": templateNewId, "fileName": fileName };
                if (data.pageLoadData.Entity == 'Quotes' || data.pageLoadData.Entity.includes("Purchase_Orders")) {

                    ZOHO.CRM.FUNCTIONS.execute(configData.customFunctions.getInventoryMergedFile, params).then(function (data) {
                        console.log(data);
                        code = data.code;
                        if ("success" == code) {
                            $("#Loading").text("Uploading documents and MailMerge Templates... Please wait.");
                            var templateData = {};
                            output = data.details.output;
                            console.log(output);

                            var jsonOutput = JSON.parse(output);
                            var response = JSON.parse(jsonOutput.response);

                            var requestId = response.requests.request_id;
                            var documentId = response.requests.document_ids[0]['document_id'];

                            var updateRecipientsData = {
                                "reqid": requestId,
                            }

                            uploadMultipleFilesWithoutMailMerge(fileLen, requestId, documentId).then(data => {
                                console.log(data);
                                // var updateDataGenerator = {};
                                var signOrderSet = 0;
                                if ($('#signOrderCheckBox').is(':checked')) {
                                    signOrderSet = 1;
                                }

                                // generateActions(updateDataGenerator, signOrderSet);
                                if ($("#docuName").val().trim() != "") {
                                    updateDataGenerator.request_name = $("#docuName").val();
                                }

                                updateDataGenerator.notes = $("#notesArea").val();
                                updateDataGenerator.description = $("#descriptionArea").val();
                                if (signOrderSet == 1) {
                                    updateDataGenerator.is_sequential = true;
                                }
                                updateDataGenerator.email_reminders = false;
                                updateDataGenerator.reminder_period = 15;

                                //expiresIn
                                expiresVal = $("#expiresIn").val();
                                if (isNaN(expiresVal)) {
                                    updateDataGenerator.expiration_days = 15;
                                } else {
                                    updateDataGenerator.expiration_days = parseInt(expiresVal);
                                }
                                var requestsJson = {};
                                requestsJson.requests = updateDataGenerator;
                                updateRecipientsData.data = encodeURIComponent(JSON.stringify(requestsJson));

                                updateRecipientsData.callback_url = encodeURIComponent(globalCallBackUrl);
                                updateRecipientsAndSendSign(updateRecipientsData);
                            });
                        }
                    })

                } else {
                    ZOHO.CRM.FUNCTIONS.execute(configData.customFunctions.getMergeFile, params).then(function (data) {
                        console.log(data);
                        code = data.code;
                        if ("success" == code) {
                            $("#Loading").text("Uploading documents and MailMerge Templates.... Please wait.");
                            var templateData = {};
                            output = data.details.output;
                            console.log(output);

                            var jsonOutput = JSON.parse(output);
                            var response = JSON.parse(jsonOutput.response);

                            var requestId = response.requests.request_id;
                            var documentId = response.requests.document_ids[0]['document_id'];

                            var updateRecipientsData = {
                                "reqid": requestId,
                            }

                            uploadMultipleFilesWithoutMailMerge(fileLen, requestId, documentId).then(data => {
                                console.log(data);
                                // var updateDataGenerator = {};
                                var signOrderSet = 0;
                                if ($('#signOrderCheckBox').is(':checked')) {
                                    signOrderSet = 1;
                                }

                                // generateActions(updateDataGenerator, signOrderSet);
                                if ($("#docuName").val().trim() != "") {
                                    updateDataGenerator.request_name = $("#docuName").val();
                                }

                                updateDataGenerator.notes = $("#notesArea").val();
                                updateDataGenerator.description = $("#descriptionArea").val();
                                if (signOrderSet == 1) {
                                    updateDataGenerator.is_sequential = true;
                                }
                                updateDataGenerator.email_reminders = false;
                                updateDataGenerator.reminder_period = 15;

                                //expiresIn
                                expiresVal = $("#expiresIn").val();
                                if (isNaN(expiresVal)) {
                                    updateDataGenerator.expiration_days = 15;
                                } else {
                                    updateDataGenerator.expiration_days = parseInt(expiresVal);
                                }
                                var requestsJson = {};
                                requestsJson.requests = updateDataGenerator;
                                updateRecipientsData.data = encodeURIComponent(JSON.stringify(requestsJson));

                                updateRecipientsData.callback_url = encodeURIComponent(globalCallBackUrl);
                                updateRecipientsAndSendSign(updateRecipientsData);
                            });
                        }
                    })
                }
            } else if (uploadFile && mmFiles == false && attachmentsFiles == false) {
                // upload file is present
                if (fileLen.length == 1 && $.find("[id*='tr_row_']").length > 0) {   // only 1 file is present in the array.

                    console.log(fileLen[0]);
                    $("#submit14").hide();
                    $("#loadingGif").show();
                    enableLoader();
                    $("#Loading").show();
                    $("#Loading").text("File Upload is in progress...");

                    var uploadDocumentData = {
                        "CONTENT_TYPE": "multipart",
                        "PARTS": [{
                            "headers": {
                                "Content-Disposition": "form-data; name=file; filename=" + fileLen[0].name,
                                "Content-Type": "multipart/form-data; charset=ISO-8859-1",

                            },
                            "content": "__FILE__"
                        }],
                        "FILE": {
                            "fileParam": "content",
                            "file": fileLen[0],
                        }
                    }
                    ZOHO.CRM.CONNECTOR.invokeAPI(configData.connectorsApi.uploadFile, uploadDocumentData)
                        .then(function (data) {
                            if (data.status_code == "200") {
                                // debugger;
                                var response = JSON.parse(data.response);
                                console.log("uploadFIle RESP : " + response);
                                $("#Loading").text("Send for E-Sign data population is in progress...");
                                var requestId = response.requests.request_id;
                                var updateRecipientsData = {
                                    "reqid": requestId,
                                }
                                var signOrderSet = 0;
                                if ($('#signOrderCheckBox').is(':checked')) {
                                    signOrderSet = 1;
                                }


                                if ($("#docuName").val().trim() != "") {
                                    updateDataGenerator.request_name = $("#docuName").val();
                                }

                                updateDataGenerator.notes = $("#notesArea").val();
                                updateDataGenerator.description = $("#descriptionArea").val();
                                if (signOrderSet == 1) {
                                    updateDataGenerator.is_sequential = true;
                                }
                                updateDataGenerator.email_reminders = false;
                                updateDataGenerator.reminder_period = 15;

                                //expiresIn
                                expiresVal = $("#expiresIn").val();
                                if (isNaN(expiresVal)) {
                                    updateDataGenerator.expiration_days = 15;
                                } else {
                                    updateDataGenerator.expiration_days = parseInt(expiresVal);
                                }
                                var requestsJson = {};
                                requestsJson.requests = updateDataGenerator;
                                updateRecipientsData.data = encodeURIComponent(JSON.stringify(requestsJson));
                                console.log(globalCallBackUrl);
                                updateRecipientsData.callback_url = encodeURIComponent(globalCallBackUrl);
                                if (hostNameisNone == false) {
                                    updateRecipientsAndSendSign(updateRecipientsData);
                                } else {
                                    $("#Loading").text('Kindly enter the value for Host name.');
                                }
                            } else {
                                alert("Error in Uploading File");
                                toggleGIF();
                                disableLoader();
                            }
                        });
                } else if (fileLen.length > 1 && $.find("[id*='tr_row_']").length > 0) {

                    $("#submit14").hide();
                    $("#loadingGif").show();
                    $("#Loading").show();
                    $("#Loading").text("File Upload is in progress...");

                    var uploadDocumentData = {
                        "CONTENT_TYPE": "multipart",
                        "PARTS": [{
                            "headers": {
                                "Content-Disposition": "form-data; name=file; filename=" + fileLen[0].name,
                                "Content-Type": "multipart/form-data; charset=ISO-8859-1",

                            },
                            "content": "__FILE__"
                        }],
                        "FILE": {
                            "fileParam": "content",
                            "file": fileLen[0],
                        }
                    }
                    ZOHO.CRM.CONNECTOR.invokeAPI(configData.connectorsApi.uploadFile, uploadDocumentData)
                        .then(async function (data) {
                            if (data.status_code == "200") {
                                // debugger;
                                var response = JSON.parse(data.response);
                                console.log("uploadFIle RESP : " + response);
                                $("#Loading").text("Send for E-Sign data population is in progress...");
                                var requestId = response.requests.request_id;
                                var updateRecipientsData = {
                                    "reqid": requestId,
                                }
                                var signOrderSet = 0;
                                if ($('#signOrderCheckBox').is(':checked')) {
                                    signOrderSet = 1;
                                }

                                if ($("#docuName").val().trim() != "") {
                                    updateDataGenerator.request_name = $("#docuName").val();
                                }

                                updateDataGenerator.notes = $("#notesArea").val();
                                updateDataGenerator.description = $("#descriptionArea").val();
                                if (signOrderSet == 1) {
                                    updateDataGenerator.is_sequential = true;
                                }
                                updateDataGenerator.email_reminders = false;
                                updateDataGenerator.reminder_period = 15;

                                //expiresIn
                                expiresVal = $("#expiresIn").val();
                                if (isNaN(expiresVal)) {
                                    updateDataGenerator.expiration_days = 15;
                                } else {
                                    updateDataGenerator.expiration_days = parseInt(expiresVal);
                                }
                                var requestsJson = {};
                                requestsJson.requests = updateDataGenerator;
                                updateRecipientsData.data = encodeURIComponent(JSON.stringify(requestsJson));
                                console.log(globalCallBackUrl);
                                updateRecipientsData.callback_url = encodeURIComponent(globalCallBackUrl);

                                // upload rest of the uploaded files from 1 to last files

                                uploadMultipleFiles(fileLen, requestId).then(data => {
                                    if (hostNameisNone == false) {
                                        console.log(data);
                                        updateRecipientsAndSendSign(updateRecipientsData);
                                    } else {
                                        $("#Loading").text('Kindly enter the value for Host name.');
                                        disableLoader();
                                    }

                                });


                            } else {
                                alert("Error in Uploading File");
                                toggleGIF();
                                disableLoader();
                            }
                        });
                }
            } else if (uploadFile == false && mmFiles && attachmentsFiles == false) {
                //mm is present
                $("#submit14").hide();
                $("#loadingGif").show();
                enableLoader();
                $("#Loading").show();
                $("#Loading").text("Processing Mail Merge Execution!");
                console.log("Upload From MailMerge Templates...");
                module = data.pageLoadData.Entity;
                recordId = data.pageLoadData.EntityId[0];
                params = { "module": module, "recordId": recordId, "templateId": templateNewId, "fileName": fileName };
                if (data.pageLoadData.Entity == 'Quotes' || data.pageLoadData.Entity.includes("Purchase_Orders")) {
                    ZOHO.CRM.FUNCTIONS.execute(configData.customFunctions.getInventoryMergedFile, params).then(function (data) {
                        console.log(data);
                        code = data.code;
                        if ("success" == code) {
                            $("#Loading").text("Processing Sign Request!");
                            var templateData = {};
                            output = data.details.output;
                            console.log(output);

                            var jsonOutput = JSON.parse(output);
                            var response = JSON.parse(jsonOutput.response);

                            var requestId = response.requests.request_id;
                            /*** Use existing code ***/
                            var updateRecipientsData = {
                                "reqid": requestId,
                            }
                            // var updateDataGenerator = {};
                            var signOrderSet = 0;
                            if ($('#signOrderCheckBox').is(':checked')) {
                                signOrderSet = 1;
                            }

                            // generateActions(updateDataGenerator, signOrderSet);
                            if ($("#docuName").val().trim() != "") {
                                updateDataGenerator.request_name = $("#docuName").val();
                            }

                            updateDataGenerator.notes = $("#notesArea").val();
                            updateDataGenerator.description = $("#descriptionArea").val();
                            if (signOrderSet == 1) {
                                updateDataGenerator.is_sequential = true;
                            }
                            updateDataGenerator.email_reminders = false;
                            updateDataGenerator.reminder_period = 15;

                            //expiresIn
                            expiresVal = $("#expiresIn").val();
                            if (isNaN(expiresVal)) {
                                updateDataGenerator.expiration_days = 15;
                            } else {
                                updateDataGenerator.expiration_days = parseInt(expiresVal);
                            }
                            var requestsJson = {};
                            requestsJson.requests = updateDataGenerator;
                            updateRecipientsData.data = encodeURIComponent(JSON.stringify(requestsJson));

                            updateRecipientsData.callback_url = encodeURIComponent(globalCallBackUrl);
                            updateRecipientsAndSendSign(updateRecipientsData);

                        } else if ("INVALID_DATA" == code) {
                            $("#Loading").text("No file is selected in the sign request, kindly select a file and proceed!");
                            $("#Loading").css({ "color": "#ff0000" });
                            disableLoader();
                            toggleGIF();
                            setTimeout(function () {
                                $("#Loading").css({ "color": "black" });
                                $("#Loading").hide();
                            }, 4000);
                        }
                    });

                } else {

                    ZOHO.CRM.FUNCTIONS.execute(configData.customFunctions.getMergeFile, params).then(function (data) {
                        console.log(data);
                        code = data.code;
                        if ("success" == code) {
                            $("#Loading").text("Processing Sign Request!");
                            var templateData = {};
                            output = data.details.output;
                            console.log(output);

                            var jsonOutput = JSON.parse(output);
                            var response = JSON.parse(jsonOutput.response);

                            var requestId = response.requests.request_id;
                            /*** Use existing code ***/
                            var updateRecipientsData = {
                                "reqid": requestId,
                            }
                            // var updateDataGenerator = {};
                            var signOrderSet = 0;
                            if ($('#signOrderCheckBox').is(':checked')) {
                                signOrderSet = 1;
                            }

                            // generateActions(updateDataGenerator, signOrderSet);
                            if ($("#docuName").val().trim() != "") {
                                updateDataGenerator.request_name = $("#docuName").val();
                            }

                            updateDataGenerator.notes = $("#notesArea").val();
                            updateDataGenerator.description = $("#descriptionArea").val();
                            if (signOrderSet == 1) {
                                updateDataGenerator.is_sequential = true;
                            }
                            updateDataGenerator.email_reminders = false;
                            updateDataGenerator.reminder_period = 15;

                            //expiresIn
                            expiresVal = $("#expiresIn").val();
                            if (isNaN(expiresVal)) {
                                updateDataGenerator.expiration_days = 15;
                            } else {
                                updateDataGenerator.expiration_days = parseInt(expiresVal);
                            }
                            var requestsJson = {};
                            requestsJson.requests = updateDataGenerator;
                            updateRecipientsData.data = encodeURIComponent(JSON.stringify(requestsJson));

                            updateRecipientsData.callback_url = encodeURIComponent(globalCallBackUrl);
                            updateRecipientsAndSendSign(updateRecipientsData);

                        } else if ("INVALID_DATA" == code) {
                            $("#Loading").text("No file is selected in the sign request, kindly select a file and proceed!");
                            $("#Loading").css({ "color": "#ff0000" });
                            toggleGIF();
                            disableLoader();
                            setTimeout(function () {
                                $("#Loading").css({ "color": "black" });
                                $("#Loading").hide();
                            }, 4000);
                        }
                    });

                }
            } else if (uploadFile == false && mmFiles == false && attachmentsFiles) {
                convertFileIdToFileArray().then(data => {
                    console.log(attachmentsFileArray);
                    $("#submit14").hide();
                    $("#loadingGif").show();
                    $("#Loading").show();
                    $("#Loading").text("Attachments file Upload is in progress...");

                    var uploadDocumentData = {
                        "CONTENT_TYPE": "multipart",
                        "PARTS": [{
                            "headers": {
                                "Content-Disposition": "form-data; name=file; filename=" + attachmentsFileArray[0].name,
                                "Content-Type": "multipart/form-data; charset=ISO-8859-1",

                            },
                            "content": "__FILE__"
                        }],
                        "FILE": {
                            "fileParam": "content",
                            "file": attachmentsFileArray[0],
                        }
                    }
                    ZOHO.CRM.CONNECTOR.invokeAPI(configData.connectorsApi.uploadFile, uploadDocumentData)
                        .then(async function (data) {
                            if (data.status_code == "200") {
                                // debugger;
                                var response = JSON.parse(data.response);
                                console.log("uploadFIle RESP : " + response);
                                $("#Loading").text("Send for E-Sign data population is in progress...");
                                var requestId = response.requests.request_id;
                                var updateRecipientsData = {
                                    "reqid": requestId,
                                }
                                var signOrderSet = 0;
                                if ($('#signOrderCheckBox').is(':checked')) {
                                    signOrderSet = 1;
                                }

                                if ($("#docuName").val().trim() != "") {
                                    updateDataGenerator.request_name = $("#docuName").val();
                                }

                                updateDataGenerator.notes = $("#notesArea").val();
                                updateDataGenerator.description = $("#descriptionArea").val();
                                if (signOrderSet == 1) {
                                    updateDataGenerator.is_sequential = true;
                                }
                                updateDataGenerator.email_reminders = false;
                                updateDataGenerator.reminder_period = 15;

                                //expiresIn
                                expiresVal = $("#expiresIn").val();
                                if (isNaN(expiresVal)) {
                                    updateDataGenerator.expiration_days = 15;
                                } else {
                                    updateDataGenerator.expiration_days = parseInt(expiresVal);
                                }
                                var requestsJson = {};
                                requestsJson.requests = updateDataGenerator;
                                updateRecipientsData.data = encodeURIComponent(JSON.stringify(requestsJson));
                                console.log(globalCallBackUrl);
                                updateRecipientsData.callback_url = encodeURIComponent(globalCallBackUrl);

                                // upload rest of the uploaded files from 1 to last files

                                uploadMultipleFiles(attachmentsFileArray, requestId).then(data => {
                                    if (hostNameisNone == false) {
                                        console.log(data);
                                        updateRecipientsAndSendSign(updateRecipientsData);
                                    } else {
                                        $("#Loading").text('Kindly enter the value for Host name.');
                                        disableLoader();
                                    }

                                });


                            } else {
                                alert("Error in Uploading File");
                                toggleGIF();
                                disableLoader();
                            }
                        });
                })
            } else if (uploadFile && mmFiles && attachmentsFiles) {
                //all three are present  
                $("#submit14").hide();
                $("#loadingGif").show();
                enableLoader();
                $("#Loading").show();
                $("#Loading").text("Processing documents, attachments and Mail Merge Execution!");
                console.log("Upload From MailMerge Templates...");
                module = data.pageLoadData.Entity;
                recordId = data.pageLoadData.EntityId[0];
                params = { "module": module, "recordId": recordId, "templateId": templateNewId, "fileName": fileName };
                if (data.pageLoadData.Entity == 'Quotes' || data.pageLoadData.Entity.includes("Purchase_Orders")) {

                    ZOHO.CRM.FUNCTIONS.execute(configData.customFunctions.getInventoryMergedFile, params).then(function (data) {
                        console.log(data);
                        code = data.code;
                        if ("success" == code) {
                            $("#Loading").text("Uploading documents.. Please wait.");
                            var templateData = {};
                            output = data.details.output;
                            console.log(output);

                            var jsonOutput = JSON.parse(output);
                            var response = JSON.parse(jsonOutput.response);

                            var requestId = response.requests.request_id;
                            var documentId = response.requests.document_ids[0]['document_id'];

                            var updateRecipientsData = {
                                "reqid": requestId,
                            }
                            convertFileIdToFileArray().then(datas => {
                                console.log(attachmentsFileArray);
                                for (let data of fileLen) {
                                    if (typeof data['size'] == 'number') {
                                        attachmentsFileArray.push(data);
                                    } else if (typeof data['size'] == 'undefined' && data['Name'] == undefined) {
                                        attachmentsFileArray.push(data);
                                    }
                                }
                                console.log(attachmentsFileArray);
                                uploadMultipleFilesWithoutMailMerge(attachmentsFileArray, requestId, documentId).then(data => {
                                    console.log(data);
                                    // var updateDataGenerator = {};
                                    var signOrderSet = 0;
                                    if ($('#signOrderCheckBox').is(':checked')) {
                                        signOrderSet = 1;
                                    }

                                    // generateActions(updateDataGenerator, signOrderSet);
                                    if ($("#docuName").val().trim() != "") {
                                        updateDataGenerator.request_name = $("#docuName").val();
                                    }

                                    updateDataGenerator.notes = $("#notesArea").val();
                                    updateDataGenerator.description = $("#descriptionArea").val();
                                    if (signOrderSet == 1) {
                                        updateDataGenerator.is_sequential = true;
                                    }
                                    updateDataGenerator.email_reminders = false;
                                    updateDataGenerator.reminder_period = 15;

                                    //expiresIn
                                    expiresVal = $("#expiresIn").val();
                                    if (isNaN(expiresVal)) {
                                        updateDataGenerator.expiration_days = 15;
                                    } else {
                                        updateDataGenerator.expiration_days = parseInt(expiresVal);
                                    }
                                    var requestsJson = {};
                                    requestsJson.requests = updateDataGenerator;
                                    updateRecipientsData.data = encodeURIComponent(JSON.stringify(requestsJson));

                                    updateRecipientsData.callback_url = encodeURIComponent(globalCallBackUrl);
                                    updateRecipientsAndSendSign(updateRecipientsData);
                                });
                            });
                            // uploadMultipleFilesWithoutMailMerge(fileLen, requestId, documentId).then(data => {
                            //     console.log(data);
                            //     // var updateDataGenerator = {};
                            //     var signOrderSet = 0;
                            //     if ($('#signOrderCheckBox').is(':checked')) {
                            //         signOrderSet = 1;
                            //     }

                            //     // generateActions(updateDataGenerator, signOrderSet);
                            //     if ($("#docuName").val().trim() != "") {
                            //         updateDataGenerator.request_name = $("#docuName").val();
                            //     }

                            //     updateDataGenerator.notes = $("#notesArea").val();
                            //     updateDataGenerator.description = $("#descriptionArea").val();
                            //     if (signOrderSet == 1) {
                            //         updateDataGenerator.is_sequential = true;
                            //     }
                            //     updateDataGenerator.email_reminders = false;
                            //     updateDataGenerator.reminder_period = 15;

                            //     //expiresIn
                            //     expiresVal = $("#expiresIn").val();
                            //     if (isNaN(expiresVal)) {
                            //         updateDataGenerator.expiration_days = 15;
                            //     } else {
                            //         updateDataGenerator.expiration_days = parseInt(expiresVal);
                            //     }
                            //     var requestsJson = {};
                            //     requestsJson.requests = updateDataGenerator;
                            //     updateRecipientsData.data = encodeURIComponent(JSON.stringify(requestsJson));

                            //     updateRecipientsData.callback_url = encodeURIComponent(globalCallBackUrl);
                            //     updateRecipientsAndSendSign(updateRecipientsData);
                            // });
                        }
                    })

                } else {
                    ZOHO.CRM.FUNCTIONS.execute(configData.customFunctions.getMergeFile, params).then(function (data) {
                        console.log(data);
                        code = data.code;
                        if ("success" == code) {
                            $("#Loading").text("Uploading documents.. Please wait.");
                            var templateData = {};
                            output = data.details.output;
                            console.log(output);
                            var jsonOutput = JSON.parse(output);
                            var response = JSON.parse(jsonOutput.response);
                            var requestId = response.requests.request_id;
                            var documentId = response.requests.document_ids[0]['document_id'];
                            var updateRecipientsData = {
                                "reqid": requestId,
                            }
                            convertFileIdToFileArray().then(datas => {
                                console.log(attachmentsFileArray);
                                for (let data of fileLen) {
                                    if (typeof data['size'] == 'number') {
                                        attachmentsFileArray.push(data);
                                    } else if (typeof data['size'] == 'undefined' && data['Name'] == undefined) {
                                        attachmentsFileArray.push(data);
                                    }
                                }
                                console.log(attachmentsFileArray);
                                uploadMultipleFilesWithoutMailMerge(attachmentsFileArray, requestId, documentId).then(data => {
                                    console.log(data);
                                    // var updateDataGenerator = {};
                                    var signOrderSet = 0;
                                    if ($('#signOrderCheckBox').is(':checked')) {
                                        signOrderSet = 1;
                                    }

                                    // generateActions(updateDataGenerator, signOrderSet);
                                    if ($("#docuName").val().trim() != "") {
                                        updateDataGenerator.request_name = $("#docuName").val();
                                    }

                                    updateDataGenerator.notes = $("#notesArea").val();
                                    updateDataGenerator.description = $("#descriptionArea").val();
                                    if (signOrderSet == 1) {
                                        updateDataGenerator.is_sequential = true;
                                    }
                                    updateDataGenerator.email_reminders = false;
                                    updateDataGenerator.reminder_period = 15;

                                    //expiresIn
                                    expiresVal = $("#expiresIn").val();
                                    if (isNaN(expiresVal)) {
                                        updateDataGenerator.expiration_days = 15;
                                    } else {
                                        updateDataGenerator.expiration_days = parseInt(expiresVal);
                                    }
                                    var requestsJson = {};
                                    requestsJson.requests = updateDataGenerator;
                                    updateRecipientsData.data = encodeURIComponent(JSON.stringify(requestsJson));

                                    updateRecipientsData.callback_url = encodeURIComponent(globalCallBackUrl);
                                    updateRecipientsAndSendSign(updateRecipientsData);
                                });
                            });

                        }
                    })
                }
            } else if (uploadFile && mmFiles == false && attachmentsFiles) {
                //uplolad and attachments are present  
                $("#submit14").hide();
                $("#loadingGif").show();
                enableLoader();
                $("#Loading").show();
                $("#Loading").text("Processing upload and attachments Execution!");
                convertFileIdToFileArray().then(datas => {
                    console.log(attachmentsFileArray);
                    for (let data of fileLen) {
                        if (typeof data['size'] == 'number') {
                            attachmentsFileArray.push(data);
                        }
                    }
                    console.log(attachmentsFileArray);
                    var uploadDocumentData = {
                        "CONTENT_TYPE": "multipart",
                        "PARTS": [{
                            "headers": {
                                "Content-Disposition": "form-data; name=file; filename=" + attachmentsFileArray[0].name,
                                "Content-Type": "multipart/form-data; charset=ISO-8859-1",

                            },
                            "content": "__FILE__"
                        }],
                        "FILE": {
                            "fileParam": "content",
                            "file": attachmentsFileArray[0],
                        }
                    }
                    ZOHO.CRM.CONNECTOR.invokeAPI(configData.connectorsApi.uploadFile, uploadDocumentData)
                        .then(async function (data) {
                            if (data.status_code == "200") {
                                // debugger;
                                var response = JSON.parse(data.response);
                                console.log("uploadFIle RESP : " + response);
                                $("#Loading").text("Send for E-Sign data population is in progress...");
                                var requestId = response.requests.request_id;
                                var updateRecipientsData = {
                                    "reqid": requestId,
                                }
                                var signOrderSet = 0;
                                if ($('#signOrderCheckBox').is(':checked')) {
                                    signOrderSet = 1;
                                }

                                if ($("#docuName").val().trim() != "") {
                                    updateDataGenerator.request_name = $("#docuName").val();
                                }

                                updateDataGenerator.notes = $("#notesArea").val();
                                updateDataGenerator.description = $("#descriptionArea").val();
                                if (signOrderSet == 1) {
                                    updateDataGenerator.is_sequential = true;
                                }
                                updateDataGenerator.email_reminders = false;
                                updateDataGenerator.reminder_period = 15;

                                //expiresIn
                                expiresVal = $("#expiresIn").val();
                                if (isNaN(expiresVal)) {
                                    updateDataGenerator.expiration_days = 15;
                                } else {
                                    updateDataGenerator.expiration_days = parseInt(expiresVal);
                                }
                                var requestsJson = {};
                                requestsJson.requests = updateDataGenerator;
                                updateRecipientsData.data = encodeURIComponent(JSON.stringify(requestsJson));
                                console.log(globalCallBackUrl);
                                updateRecipientsData.callback_url = encodeURIComponent(globalCallBackUrl);

                                // upload rest of the uploaded files from 1 to last files

                                uploadMultipleFiles(attachmentsFileArray, requestId).then(data => {
                                    if (hostNameisNone == false) {
                                        console.log(data);
                                        updateRecipientsAndSendSign(updateRecipientsData);
                                    } else {
                                        $("#Loading").text('Kindly enter the value for Host name.');
                                        disableLoader();
                                    }

                                });


                            } else {
                                alert("Error in Uploading File");
                                toggleGIF();
                                disableLoader();
                            }
                        });
                });
            } else if (uploadFile == false && mmFiles && attachmentsFiles) {
                //mm and attachments are present  
                $("#submit14").hide();
                $("#loadingGif").show();
                enableLoader();
                $("#Loading").show();
                $("#Loading").text("Processing Mail Merge and attachments Execution!");
                console.log("Upload From MailMerge Templates...");
                module = data.pageLoadData.Entity;
                recordId = data.pageLoadData.EntityId[0];
                params = { "module": module, "recordId": recordId, "templateId": templateNewId, "fileName": fileName };
                if (data.pageLoadData.Entity == 'Quotes' || data.pageLoadData.Entity.includes("Purchase_Orders")) {

                    ZOHO.CRM.FUNCTIONS.execute(configData.customFunctions.getInventoryMergedFile, params).then(function (data) {
                        console.log(data);
                        code = data.code;
                        if ("success" == code) {
                            $("#Loading").text("Uploading documents.. Please wait.");
                            var templateData = {};
                            output = data.details.output;
                            console.log(output);

                            var jsonOutput = JSON.parse(output);
                            var response = JSON.parse(jsonOutput.response);

                            var requestId = response.requests.request_id;
                            var documentId = response.requests.document_ids[0]['document_id'];

                            var updateRecipientsData = {
                                "reqid": requestId,
                            }
                            convertFileIdToFileArray().then(datas => {
                                console.log(attachmentsFileArray);
                                for (let data of fileLen) {
                                    if (typeof data['size'] == 'undefined' && data['Name'] == undefined) {
                                        attachmentsFileArray.push(data);
                                    }
                                }
                                console.log(attachmentsFileArray);
                                uploadMultipleFilesWithoutMailMerge(attachmentsFileArray, requestId, documentId).then(data => {
                                    console.log(data);
                                    // var updateDataGenerator = {};
                                    var signOrderSet = 0;
                                    if ($('#signOrderCheckBox').is(':checked')) {
                                        signOrderSet = 1;
                                    }

                                    // generateActions(updateDataGenerator, signOrderSet);
                                    if ($("#docuName").val().trim() != "") {
                                        updateDataGenerator.request_name = $("#docuName").val();
                                    }

                                    updateDataGenerator.notes = $("#notesArea").val();
                                    updateDataGenerator.description = $("#descriptionArea").val();
                                    if (signOrderSet == 1) {
                                        updateDataGenerator.is_sequential = true;
                                    }
                                    updateDataGenerator.email_reminders = false;
                                    updateDataGenerator.reminder_period = 15;

                                    //expiresIn
                                    expiresVal = $("#expiresIn").val();
                                    if (isNaN(expiresVal)) {
                                        updateDataGenerator.expiration_days = 15;
                                    } else {
                                        updateDataGenerator.expiration_days = parseInt(expiresVal);
                                    }
                                    var requestsJson = {};
                                    requestsJson.requests = updateDataGenerator;
                                    updateRecipientsData.data = encodeURIComponent(JSON.stringify(requestsJson));

                                    updateRecipientsData.callback_url = encodeURIComponent(globalCallBackUrl);
                                    updateRecipientsAndSendSign(updateRecipientsData);
                                });
                            });

                        }
                    })

                } else {
                    ZOHO.CRM.FUNCTIONS.execute(configData.customFunctions.getMergeFile, params).then(function (data) {
                        console.log(data);
                        code = data.code;
                        if ("success" == code) {
                            $("#Loading").text("Uploading documents.. Please wait.");
                            var templateData = {};
                            output = data.details.output;
                            console.log(output);
                            var jsonOutput = JSON.parse(output);
                            var response = JSON.parse(jsonOutput.response);
                            var requestId = response.requests.request_id;
                            var documentId = response.requests.document_ids[0]['document_id'];
                            var updateRecipientsData = {
                                "reqid": requestId,
                            }
                            convertFileIdToFileArray().then(datas => {
                                console.log(attachmentsFileArray);
                                for (let data of fileLen) {
                                    if (typeof data['size'] == 'undefined' && data['Name'] == undefined) {  // mail merge
                                        attachmentsFileArray.push(data);
                                    }
                                }
                                console.log(attachmentsFileArray);
                                uploadMultipleFilesWithoutMailMerge(attachmentsFileArray, requestId, documentId).then(data => {
                                    console.log(data);
                                    // var updateDataGenerator = {};
                                    var signOrderSet = 0;
                                    if ($('#signOrderCheckBox').is(':checked')) {
                                        signOrderSet = 1;
                                    }

                                    // generateActions(updateDataGenerator, signOrderSet);
                                    if ($("#docuName").val().trim() != "") {
                                        updateDataGenerator.request_name = $("#docuName").val();
                                    }

                                    updateDataGenerator.notes = $("#notesArea").val();
                                    updateDataGenerator.description = $("#descriptionArea").val();
                                    if (signOrderSet == 1) {
                                        updateDataGenerator.is_sequential = true;
                                    }
                                    updateDataGenerator.email_reminders = false;
                                    updateDataGenerator.reminder_period = 15;

                                    //expiresIn
                                    expiresVal = $("#expiresIn").val();
                                    if (isNaN(expiresVal)) {
                                        updateDataGenerator.expiration_days = 15;
                                    } else {
                                        updateDataGenerator.expiration_days = parseInt(expiresVal);
                                    }
                                    var requestsJson = {};
                                    requestsJson.requests = updateDataGenerator;
                                    updateRecipientsData.data = encodeURIComponent(JSON.stringify(requestsJson));

                                    updateRecipientsData.callback_url = encodeURIComponent(globalCallBackUrl);
                                    updateRecipientsAndSendSign(updateRecipientsData);
                                });
                            });

                        }
                    })
                }
            }
        } else {
            $('#docuNameValidation').text("Please enter a value for Doc Name.");
        }
    } else {
    }

}

async function convertFileIdToFileArray() {
    attachmentsFileArray = [];
    fileNames = [];
    var count = 0;
    for (k = 0; k < fileLen.length; k++) {
        console.log(fileLen);

        console.log(fileLen[k]['fileId'] !== undefined);
        if (fileLen[k]['fileId'] !== undefined) {
            var config = {
                id: fileLen[k]['fileId']
            }
            console.log(fileLen[k]['fileId']);
            fileNames.push(fileLen[k]['Name']);
            let input = await new Promise(resolve => {
                ZOHO.CRM.API.getFile(config).then(datas => {
                    console.log(datas);
                    var file = new File([datas], fileNames[count]);
                    count++;
                    attachmentsFileArray.push(file);
                    resolve(datas);
                })
            });
        }
    }

}


function okay() {
    ZOHO.CRM.UI.Popup.closeReload()
        .then(function (data) {
            console.log(data);
        })
}


function updateRecipientsAndSendSign(updateRecipientsInfo) {
    ZOHO.CRM.CONNECTOR.invokeAPI(configData.connectorsApi.updaterecipient, updateRecipientsInfo)
        .then(function (data) {
            console.log(data);
            if (data.status_code == "200") {
                // debugger;
                var response = JSON.parse(data.response);
                console.log("updaterecipient 2 :: " + response);
                var recipientResp = response.requests;
                docIdList = recipientResp.document_ids;
                newReciep = generateFields(recipientResp, docIdList);
                console.log(newReciep);
                var actionMap = {};
                actionMap.actions = newReciep;
                var requestId = recipientResp.request_id;
                var updateRecipientsData = {
                    "reqId": requestId,
                }
                var requestsJson = {};
                requestsJson.requests = actionMap;

                console.log("before encode :: ");
                console.log(requestsJson);
                updateRecipientsData.data = encodeURIComponent(JSON.stringify(requestsJson));
                console.log("After encode :: ");
                console.log(updateRecipientsData);
                ZOHO.CRM.CONNECTOR.invokeAPI(configData.connectorsApi.sendsignrequest, updateRecipientsData)
                    .then(function (data) {
                        console.log("sendsignrequest ::: ");
                        console.log(data);
                        // debugger;
                        if (data.status_code < 300) {

                            $("#Loading").text("uploadFile / Mail Merge sendsignrequest is done!");
                            populateZohoSignDocuments(response, fileLen);
                        }
                        else {
                            r = data.response;
                            code = JSON.parse(r).code;
                            if (code == 9101) {
                                $("#Loading").text("Error in sendsignrequest! Kindly add atleast one field for a signer.");
                                disableLoader();

                            } else {
                                $("#Loading").text("Error in sendsignrequest!");
                                disableLoader();

                            }
                        }

                    });

            } else {
                // alert("Error in updateRecipients");
                $("#Loading").text("Error in Update recipients! Kindly make sure, that you have entered a valid data / mandatory details including Host, if you have selected In Person Signer option.");

                toggleGIF();
                disableLoader();

                }
        });
}

function populateZohoSignDocumentsEvents(response, recordId, file) {
    zsignDocumentEvent = configData.signRelatedModulesAPIName.ZSignDocumentEvents;//JSON.parse(configData.signRelatedModulesAPIName).ZSignDocumentEvents;
    zohoSignDocumentsEvents = getMetaData(zsignDocumentEvent + "1");//getMetaData("ZohoSign_Document_Events1");
    configData.zsignDocuEventFields[0].Name;
    var arrData = [];
    var params = {};
    params[configData.zsDocuEventFields.Name] = response.requests.document_ids[0].document_name + "-" + "SIGNATURE_REQUESTED";
    params[configData.zsDocuEventFields.Description] = "Sent out for Signature";
    params[configData.zsDocuEventFields.ZohoSign_Documents] = recordId;

    var date = new Date();

    var formattedDate = date.getFullYear() + '-' + ('0' + (date.getMonth() + 1)).slice(-2) + '-' + ('0' + date.getDate()).slice(-2);
    params.Date = formattedDate;

    arrData.push(params);
    var params1 = {};
    params1[configData.zsDocuEventFields.Name] = response.requests.document_ids[0].document_name + "-" + "SIGNATURE_INPROGRESS";
    params1[configData.zsDocuEventFields.Description] = "Sent out for Signature and inprogess stage";
    params1[configData.zsDocuEventFields.ZohoSign_Documents] = recordId;
    params1.Date = formattedDate;
    arrData.push(params1);

    ZOHO.CRM.API.insertRecord({
        Entity: zohoSignDocumentsEvents.api_name,
        APIData: arrData
    }).then(function (data) {
        var code = data.data[0].code;
        if (code.includes("SUCCESS")) {
            var editUrl = response.requests.request_edit_url;
            console.log(editUrl);
            $("#Loading").text("uploadFile / Mail Merge sendsignrequest is done!");
            $('#btnTrigger').click();
            document.getElementById('sucessAndFailureResponse').innerHTML = 'Upload documents / Mail merge has been successfully Completed.';
            document.getElementById('updateDowngrade').innerHTML = 'E-Sign';

        } else {
            alert("Error in writing in ZohoSign Document Events");
            toggleGIF();
            disableLoader();

        }
    });
}

function populateZohoSignRecipients(response, recordId, file) {
    var params = [];
    zsignRecipient = configData.signRelatedModulesAPIName.ZSignRecipients;//JSON.parse(configData.signRelatedModulesAPIName).ZSignRecipients;
    zohoSignRecipients = getMetaData(zsignRecipient + "1");//getMetaData("ZohoSign_Recipients1");
    var keys = Object.keys(recipients);
    for (var _i = 0; _i < keys.length; _i++) {
        var currentKey = keys[_i];
        var tempObj = {};
        tempObj[configData.zsRecipFields.Name] = recipients[currentKey].split("&")[0];
        tempObj[configData.zsRecipFields.Email] = recipients[currentKey].split("&")[1];
        tempObj[configData.zsRecipFields.Recipient_Type] = recipients[currentKey].split("&")[3] == "SIGN" ? "SIGNER" : "CC";
        tempObj[configData.zsRecipFields.ZohoSign_Document_ID] = response.requests.document_ids[0].document_id;
        tempObj[configData.zsRecipFields.ZohoSign_Document] = recordId;
        tempObj[configData.zsRecipFields.Recipient_Status] = "UNOPENED";
        params[_i] = tempObj;
    }
    ZOHO.CRM.API.insertRecord({
        Entity: zohoSignRecipients.api_name,
        APIData: params
    });
    populateZohoSignDocumentsEvents(response, recordId, file);
}

function populateZohoSignDocuments(response, fileLen) {
    var recordId;
    zSignDocument = configData.signRelatedModulesAPIName.ZSignDocuments;
    zohoSignDocument = getMetaData(zSignDocument + "1");
    var date = new Date();
    var formattedDate = date.getFullYear() + '-' + ('0' + (date.getMonth() + 1)).slice(-2) + '-' + ('0' + date.getDate()).slice(-2);
    var params = {};
    params[configData.zsDocuFields.ZohoSign_Document_ID] = response.requests.document_ids[0].document_id;  // add all the doc id with comma sep
    params[configData.zsDocuFields.Date_Sent] = formattedDate;
    params[configData.zsDocuFields.Name] = response.requests.request_name;
    params[configData.zsDocuFields.Document_Status] = "INPROGRESS";
    params["Sign_Request_ID"] = response.requests.request_id + "";
    params["Is_Sign_Reminder_Sent"] = false;
    params["Number_of_Sign_Reminder_Sent"] = "0";

    var singularModuleName = data.pageLoadData.Entity.substr(0, data.pageLoadData.Entity.length - 1);
    params[singularModuleName] = String(data.pageLoadData.EntityId[0]);

    if (data.pageLoadData.Entity.includes("Deals")) {
        params["Deals1"] = String(data.pageLoadData.EntityId[0]);  // changed from Deals to Deals1
        params["Deals"] = String(data.pageLoadData.EntityId[0]);  // changed from Deals to Deals1

        if (lookupRecData.Horse != undefined) {
            params["Horse"] = lookupRecData.Horse.id;
        }
        params["Contacts"] = lookupRecData.Contact_Name.id;
    } else if (data.pageLoadData.Entity.includes("Contract_Changes")) {
        params["Contract_Changes"] = String(data.pageLoadData.EntityId[0]);
        params["Contacts"] = lookupRecData.Contact_Name.id;
    } else if (data.pageLoadData.Entity.includes("Quotes")) {
        params['Quotes'] = data.pageLoadData.EntityId[0];
    } else if (data.pageLoadData.Entity.includes("Audits")) {
        params['Audits'] = data.pageLoadData.EntityId[0];
    } else if (data.pageLoadData.Entity.includes("Auditors")) {
        params['Auditors'] = data.pageLoadData.EntityId[0];
    } else if (data.pageLoadData.Entity.includes("Auditor_Competencies")) {
        params['Auditor_Competencies'] = data.pageLoadData.EntityId[0];
    } else if (data.pageLoadData.Entity.includes("Accounts")) {
        params['Accounts'] = data.pageLoadData.EntityId[0];
    } else if (data.pageLoadData.Entity.includes("Purchase_Orders")) {
        params['PO_Contract_Changes'] = data.pageLoadData.EntityId[0];
    } else {
        params["Contacts"] = lookupRecData.id;
        params["Contacts1"] = lookupRecData.id;
    }
    // params["trigger"] = ['workflow'];

    ZOHO.CRM.API.insertRecord({
        Entity: zohoSignDocument.api_name,
        APIData: params,
        Trigger: ["workflow"]
    }).then(function (data) {
        var resp = data.data[0].code;
        if (resp.includes("SUCCESS")) {
            recordId = data.data[0].details.id;

            // Gowtham implemented for multiple uploaded files

            console.log(uploadFile);
            console.log(mmFiles);
            console.log(attachmentsFiles);

            if (uploadFile && mmFiles == false && attachmentsFiles == false) {
                var tempFile = fileLen.length > 0 ? fileLen : undefined;
                fileLen.forEach(element => {
                    readFileAsArrayBuffer(element, function (datas) {
                        console.log("Main Place!");
                        console.log(datas);
                        console.log(element.name);
                        blob = new Blob([new Uint8Array(datas)]);
                        ZOHO.CRM.API.attachFile({
                            Entity: zohoSignDocument.api_name,
                            RecordID: recordId,
                            File: {
                                Name: element.name,
                                Content: blob
                            }
                        }).then(function (result) {
                            console.log("Gowtham!");
                            console.log(result);
                        });
                    }, function (e) {
                        console.error(e);
                    });
                })
                populateZohoSignRecipients(response, recordId, fileLen);
            } else if (uploadFile == false && mmFiles == true && attachmentsFiles == false) {
                var documentId = response['requests']['document_ids'][0]['document_id'];
                var documentName = response['requests']['document_ids'][0]['document_name'];
                console.log(documentId);
                downloadMMFile = {};
                downloadMMFile = {
                    "reqId": response['requests']['request_id'],
                    "docId": documentId,
                    "RESPONSE_TYPE": "stream"
                }
                ZOHO.CRM.CONNECTOR.invokeAPI(configData.connectorsApi.downloadDocument, downloadMMFile)
                    .then(function (gow) {
                        console.log(gow);
                        ZOHO.CRM.API.attachFile({
                            Entity: zohoSignDocument.api_name,
                            RecordID: recordId,
                            File: {
                                Name: documentName + '.pdf',
                                Content: gow
                            }
                        }).then(function (result) {
                            console.log("Gowtham..!");
                            console.log(result);
                            console.log(JSON.stringify(result));
                            // debugger;
                            populateZohoSignRecipients(response, recordId, fileLen);
                            return;
                        })

                    });

                console.log(response);
            } else if (uploadFile && mmFiles && attachmentsFiles == false) {
                console.log(fileLen);
                fileLen.forEach(element => {
                    if (typeof element['size'] == 'number') {
                        readFileAsArrayBuffer(element, function (datas) {
                            console.log("Main Place!");
                            console.log(datas);
                            console.log(element.name);
                            blob = new Blob([new Uint8Array(datas)]);
                            ZOHO.CRM.API.attachFile({
                                Entity: zohoSignDocument.api_name,
                                RecordID: recordId,
                                File: {
                                    Name: element.name,
                                    Content: blob
                                }
                            }).then(function (result) {
                                console.log("Harry!");
                                console.log(result);
                            });
                        }, function (e) {
                            console.error(e);
                        });

                    } else {
                        var documentId = element['Document_Id'];
                        var documentName = element['name'].split(".");
                        var DocName = documentName[0];
                        console.log(documentId);
                        downloadMMFile = {};
                        downloadMMFile = {
                            "reqId": element['requestId'],
                            "docId": documentId,
                            "RESPONSE_TYPE": "stream"
                        }
                        ZOHO.CRM.CONNECTOR.invokeAPI(configData.connectorsApi.downloadDocument, downloadMMFile)
                            .then(function (gow) {
                                console.log(gow);
                                ZOHO.CRM.API.attachFile({
                                    Entity: zohoSignDocument.api_name,
                                    RecordID: recordId,
                                    File: {
                                        Name: DocName + '.pdf',
                                        Content: gow
                                    }
                                }).then(function (result) {
                                    console.log("Mm file Gowtham..!");
                                    console.log(result);
                                    setTimeout(() => {
                                        populateZohoSignRecipients(response, recordId, fileLen);
                                    }, 4000);
                                    console.log(JSON.stringify(result));
                                })

                            });

                        console.log(response);
                    }
                });

            } else if (uploadFile == false && mmFiles == false && attachmentsFiles) {
                attachmentsFileArray.forEach(element => {
                    readFileAsArrayBuffer(element, function (datas) {
                        console.log("Main Place!");
                        console.log(datas);
                        console.log(element.name);
                        blob = new Blob([new Uint8Array(datas)]);
                        ZOHO.CRM.API.attachFile({
                            Entity: zohoSignDocument.api_name,
                            RecordID: recordId,
                            File: {
                                Name: element.name,
                                Content: blob
                            }
                        }).then(function (result) {
                            console.log("Gowtham!");
                            console.log(result);
                        });
                    }, function (e) {
                        console.error(e);
                    });
                })
                populateZohoSignRecipients(response, recordId, attachmentsFileArray);
            } else if (uploadFile && mmFiles && attachmentsFiles) {
                console.log(attachmentsFileArray);
                attachmentsFileArray.forEach(element => {
                    if (typeof element['size'] == 'number') {
                        readFileAsArrayBuffer(element, function (datas) {
                            console.log("Main Place!");
                            console.log(datas);
                            console.log(element.name);
                            blob = new Blob([new Uint8Array(datas)]);
                            ZOHO.CRM.API.attachFile({
                                Entity: zohoSignDocument.api_name,
                                RecordID: recordId,
                                File: {
                                    Name: element.name,
                                    Content: blob
                                }
                            }).then(function (result) {
                                console.log("Harry!");
                                console.log(result);
                            });
                        }, function (e) {
                            console.error(e);
                        });

                    } else {
                        var documentId = element['Document_Id'];
                        var documentName = element['name'].split(".");
                        var DocName = documentName[0];
                        console.log(documentId);
                        downloadMMFile = {};
                        downloadMMFile = {
                            "reqId": element['requestId'],
                            "docId": documentId,
                            "RESPONSE_TYPE": "stream"
                        }
                        ZOHO.CRM.CONNECTOR.invokeAPI(configData.connectorsApi.downloadDocument, downloadMMFile)
                            .then(function (gow) {
                                console.log(gow);
                                ZOHO.CRM.API.attachFile({
                                    Entity: zohoSignDocument.api_name,
                                    RecordID: recordId,
                                    File: {
                                        Name: DocName + '.pdf',
                                        Content: gow
                                    }
                                }).then(function (result) {
                                    console.log("Mm file Gowtham..!");
                                    console.log(result);
                                    setTimeout(() => {
                                        populateZohoSignRecipients(response, recordId, attachmentsFileArray);
                                    }, 4000);
                                    console.log(JSON.stringify(result));
                                })

                            });

                        console.log(response);
                    }
                });

            } else if (uploadFile && mmFiles == false && attachmentsFiles) {
                attachmentsFileArray.forEach(element => {
                    readFileAsArrayBuffer(element, function (datas) {
                        console.log("Main Place!");
                        console.log(datas);
                        console.log(element.name);
                        blob = new Blob([new Uint8Array(datas)]);
                        ZOHO.CRM.API.attachFile({
                            Entity: zohoSignDocument.api_name,
                            RecordID: recordId,
                            File: {
                                Name: element.name,
                                Content: blob
                            }
                        }).then(function (result) {
                            console.log("Gowtham!");
                            console.log(result);
                        });
                    }, function (e) {
                        console.error(e);
                    });
                })
                populateZohoSignRecipients(response, recordId, fileLen);
            } else if (uploadFile == false && mmFiles && attachmentsFiles) {
                console.log(attachmentsFileArray);
                attachmentsFileArray.forEach(element => {
                    if (typeof element['size'] == 'number') {
                        readFileAsArrayBuffer(element, function (datas) {
                            console.log("Main Place!");
                            console.log(datas);
                            console.log(element.name);
                            blob = new Blob([new Uint8Array(datas)]);
                            ZOHO.CRM.API.attachFile({
                                Entity: zohoSignDocument.api_name,
                                RecordID: recordId,
                                File: {
                                    Name: element.name,
                                    Content: blob
                                }
                            }).then(function (result) {
                                console.log("Harry!");
                                console.log(result);
                            });
                        }, function (e) {
                            console.error(e);
                        });

                    } else {
                        var documentId = element['Document_Id'];
                        var documentName = element['name'].split(".");
                        var DocName = documentName[0];
                        console.log(documentId);
                        downloadMMFile = {};
                        downloadMMFile = {
                            "reqId": element['requestId'],
                            "docId": documentId,
                            "RESPONSE_TYPE": "stream"
                        }
                        ZOHO.CRM.CONNECTOR.invokeAPI(configData.connectorsApi.downloadDocument, downloadMMFile)
                            .then(function (gow) {
                                console.log(gow);
                                ZOHO.CRM.API.attachFile({
                                    Entity: zohoSignDocument.api_name,
                                    RecordID: recordId,
                                    File: {
                                        Name: DocName + '.pdf',
                                        Content: gow
                                    }
                                }).then(function (result) {
                                    console.log("Mm file Gowtham..!");
                                    console.log(result);
                                    setTimeout(() => {
                                        populateZohoSignRecipients(response, recordId, attachmentsFileArray);
                                    }, 4000);
                                    console.log(JSON.stringify(result));
                                })

                            });

                        console.log(response);
                    }
                });
            }
        } else {
            alert("Error in writing in ZohoSignDocuments");
            toggleGIF();
            disableLoader();

        }
    });
}

function readFileAsArrayBuffer(file, success, error) {
    console.log("Hey Inside readFileAsArrayBuffer seperate method!");

    var fr = new FileReader();
    fr.addEventListener('error', error, false);
    if (fr.readAsBinaryString) {
        console.log("readAsBinaryString is working!");
        fr.addEventListener('load', function () {
            console.log("inside load! ");
            var string = this.resultString != null ? this.resultString : this.result;
            var result = new Uint8Array(string.length);
            for (var i = 0; i < string.length; i++) {
                result[i] = string.charCodeAt(i);
            }
            success(result.buffer);
        }, false);
        console.log("going to return!! ");
        return fr.readAsBinaryString(file);
    } else {
        console.log("AsArrayBuffer is working!");
        fr.addEventListener('load', function () {
            success(this.result);
        }, false);
        return fr.readAsArrayBuffer(file);
    }
}

function getInventoryTemplates() {
    //{"templates":[],"info":{"per_page":200,"count":0,"page":1,"more_records":false}}
    params = { "module": data.pageLoadData.Entity };
    ZOHO.CRM.FUNCTIONS.execute(configData.customFunctions.getInventoryTemplates, params).then(function (data) {

        console.log(data);
        code = data.code;
        if ("success" == code) {
            var templateData = {};
            output = data.details.output;
            console.log(output);
            var resp = JSON.parse(output);
            jsonResp = JSON.parse(resp.response)
            //jsonResp={"templates":[{"module":"Deals","last_used":null,"description":null,"type":"writer","created_by":{"name":"Matt Moffett","id":"3839889000000201013"},"folder":{"id":"3839889000000388003"},"modified_time":"2019-08-08T03:35:20-07:00","name":"JM Leadership Workshop Agreement.docx","modified_by":{"name":"Matt Moffett","id":"3839889000000201013"},"resource_id":"0988d42e032c333c84a6183c46b574642669f","id":"3839889000000410128","module_name":"Deals","favorite":false},{"module":"Deals","last_used":null,"description":null,"type":"writer","created_by":{"name":"Matt Moffett","id":"3839889000000201013"},"folder":{"id":"3839889000000388003"},"modified_time":"2019-07-31T11:02:23-07:00","name":"JMT Standard Coaching Agreement.doc","modified_by":{"name":"Matt Moffett","id":"3839889000000201013"},"resource_id":"10ndk710b1e6d27ce435fbe69e56ec312fb6d","id":"3839889000000397141","module_name":"Deals","favorite":false}],"info":{"per_page":200,"count":2,"page":1,"more_records":false}};
            templatesSize = jsonResp.inventory_templates.length;
            if (templatesSize > 0) {
                var tempList = [];//jsonResp.templates;
                var jsonObj = {};
                for (i = 0; i < templatesSize; i++) {
                    tempList.push({ "Id": jsonResp.inventory_templates[i].id, "Name": jsonResp.inventory_templates[i].name });
                }
                templateData = {
                    files: tempList
                }
            }
            $(".bg").show();
            Utils.RenderTemplate("mmTemplateListing", templateData, "fileFromMailMerge", showSelectBOx);
        }
    }, function (err) {
        var templateData = {};
        $(".bg").show();
        Utils.RenderTemplate("mmTemplateListing", templateData, "fileFromMailMerge", showSelectBOx);
        $(".file-box").text("You need API and Workflow Permissions to fetch Mail Merge templates, Please contact your administrator");
    });

}

function getMailMergeTemplates() {
    //{"templates":[],"info":{"per_page":200,"count":0,"page":1,"more_records":false}}

    if (data.pageLoadData.Entity == 'Quotes' || data.pageLoadData.Entity == 'Purchase_Orders') {
        getInventoryTemplates();
    } else {
        params = { "module": data.pageLoadData.Entity };
        ZOHO.CRM.FUNCTIONS.execute(configData.customFunctions.getMMTemplates, params).then(function (data) {

            console.log(data);
            code = data.code;
            if ("success" == code) {
                var templateData = {};
                output = data.details.output;
                console.log(output);
                var jsonResp = JSON.parse(output);

                templatesSize = jsonResp.templates.length;
                if (templatesSize > 0) {
                    var tempList = [];//jsonResp.templates;
                    var jsonObj = {};
                    for (i = 0; i < templatesSize; i++) {
                        tempList.push({ "Id": jsonResp.templates[i].id, "Name": jsonResp.templates[i].name });
                    }
                    templateData = {
                        files: tempList
                    }
                }
                $(".bg").show();
                Utils.RenderTemplate("mmTemplateListing", templateData, "fileFromMailMerge", showSelectBOx);
            }
        }, function (err) {
            var templateData = {};
            $(".bg").show();
            Utils.RenderTemplate("mmTemplateListing", templateData, "fileFromMailMerge", showSelectBOx);
            $(".file-box").text("You need API and Workflow Permissions to fetch Mail Merge templates, Please contact your administrator");
        });
    }
}

function addMMTemplate() {
    console.log("addMMTemplate");
    templateId = $("#templates").find(":selected").val();
    if ("-None-" == templateId) {
        alert("Please select a template to create document.");
        return;
    }

    $("#addTemplate").text("Creating");
    $("#addTemplate").css({
        "cursor": "wait",
        "pointer-events": "none"
    });

    fileName = $("#templates").find(":selected").text();
    // $("#docuName").val(fileName);

    cancelPopup();
    $('input[type="file"]').attr('title', window.webkitURL ? ' ' : '');

    if (fileLen.length == 0) {
        $(".appText").html(fileName);
        $("#docuName").val(fileName);
        var body = '';
        var fileType = fileName.split('.');
        body = `<tr><td>${fileType[0]}</td> <td> ${fileType[fileType.length - 1]} </td> <td class="pR oH"><a href="javascript:;" onclick="deleteMailMerge('${fileName}')" class="delete">Remove</a></td>`
        document.getElementById('documentRecords').innerHTML = body;
        var MMtemplate = {
            name: fileName
        }
        fileLen.push(MMtemplate);
    } else if (fileLen.length > 0) {
        $(".appText").html('Two or more files added.');

        var MMtemplate = {
            name: fileName
        }
        fileLen.push(MMtemplate);
        setFileNameAndTypeInTables(fileLen);
    }
}

function getMailMergeValue() {
    var e = document.getElementById("gow");
    var value = e.value;
    var text = e.options[e.selectedIndex].text;
    console.log(value);
    templateNewId = value;
    templateNewText = text;
    console.log(text);
}

function addMMTemplateNew() {
    console.log("addMMTemplate");
    if (templateNewId == "" && templateNewId.length == 0) {
        alert("Please select a template to create document.");
        return;
    }
    fileName = templateNewText;
    closesMM();
    if (fileLen.length == 0) {
        $(".appText").html(fileName);
        $("#docuName").val(fileName);
        var body = '';
        var fileType = fileName.split('.');
        body = `<tr><td>${fileType[0]}</td> <td> ${fileType[fileType.length - 1]} </td> <td class="pR oH"><a href="javascript:;" onclick="deleteMailMerge('${fileName}')" class="delete">Remove</a></td>`
        document.getElementById('documentRecords').innerHTML = body;
        var MMtemplate = {
            name: fileName
        }
        fileLen.push(MMtemplate);
    } else if (fileLen.length > 0) {
        $(".appText").html('Two or more files added.');

        var MMtemplate = {
            name: fileName
        }
        fileLen.push(MMtemplate);
        setFileNameAndTypeInTables(fileLen);
    }
}

function deleteMailMerge(fileName) {
    var index;
    document.getElementById('documentRecords').innerHTML = '';
    for (var i = 0; i < fileLen.length; i++) {
        if (fileLen[i].name == fileName && typeof fileLen[i].size == 'undefined') {
            index = i;
        }
    }
    fileLen.splice(index, 1);
    console.log(fileLen);
}
function deleteAttachments(fileName) {
    for (var i = 0; i < fileLen.length; i++) {
        if (fileLen[i]['Name'] != undefined) {
            if (fileLen[i]?.Name.split('.')[0] == fileName) {
                index = i;
            }
        }
    }
    fileLen.splice(index, 1);
    console.log(fileLen);
    setFileNameAndTypeInTables(fileLen);
}
function setFileFromDocs() {
    console.log("ITS setFileFromDocs!");
    var testReq = {
        //url : "http://eapp.docs.localzohoplatform.com/api/v2/files",
        url: "http://e360crm.docs.zohoplatform.com/api/v2/files",
        params: {
            action: "crmworkspaces",
            zsoid: zsoid,
            folderid: -1,
            start: 0,
            end: 50,
            scope: "crmapi",
            type: "AllUsers"
        },
        headers: {
            Authorization: DocsAuthToken,
        }
    };
    ZOHO.CRM.HTTP.get(testReq).then(function (data) {
        console.log(data);
        var resultJson = JSON.parse(data);
        var templateData = {};
        recordCount = resultJson.total_resources[0].no_of_res;
        if (recordCount <= 0) {
            alert("No records found in Document Space!");
        } else {
            var dataList = [];
            var recordLength = resultJson.dataobj.length;
            for (i = 0; i < recordLength; i++) {
                var fileData = resultJson.dataobj[i];
                if (fileData.hasOwnProperty("split_value")) {
                    continue;
                }
                dataList.push(fileData);
            }
            templateData = {
                files: dataList
            }
        }
        $(".bg").show();
        Utils.RenderTemplate("fileListing", templateData, "fileUploadFromDocs", Utils.hideLoading);
    })
}
function setFileName() {
    console.log("This is setFileName!", document.getElementById("file").files);
    var arr = document.getElementById("file");
    if (fileLen.length == 1 && typeof fileLen[0].size == 'undefined') {
        for (var j = 0; j < arr.files.length; j++) {
            fileLen.push(arr.files[j]);
        }
    } else if (fileLen.length > 1) {
        // fileLen = [];
        fileLen = [...fileLen, ...arr.files];
    } else {
        fileLen = [];
        fileLen = [...arr.files];
    }
    console.log(fileLen);
    $("#docuName").val('');
    if (fileLen.length == 1) {
        var fileName = document.getElementById("file").files[0].name;
        $(".appText").html(fileName);
        $("#docuName").val(fileName);
    } else if (fileLen.length > 1) {
        $(".appText").html("Two or more file's uploaded");
        $("#docuName").val(fileLen[0].name);

    }
    setFileNameAndTypeInTables(fileLen);
    console.log(document.getElementById("file").files);
}
function setFileNameAndTypeInTables(fileArr) {
    var body = '';
    for (var i = 0; i < fileArr.length; i++) {
        if (fileArr[i]['Name'] != undefined) {
            var fileName = fileArr[i]['Name'].split('.')[0];
            var fileType = fileArr[i]['Name'].split('.')[1];
            body = body + `<tr><td>${fileName}</td> <td> ${fileType} </td> <td class="pR oH"><a href="javascript:;" onclick="deleteAttachments('${fileName}')" class="delete">Remove</a></td>`
        } else if (fileArr[i]['name'] != undefined) {
            var fileType = fileArr[i].name.split('.');
            console.log(fileType[fileType.length - 1]);
            body += `<tr><td>${fileType[0]}</td> <td> ${fileType[fileType.length - 1]} </td> <td class="pR oH"><a href="javascript:;" onclick="deleteFiles(${i})" class="delete">Remove</a></td>`
        }
    }
    document.getElementById('documentRecords').innerHTML = body;
}
function deleteFiles(index) {
    console.log(index);
    console.log(fileLen);
    fileLen.splice(index, 1);
    setFileNameAndTypeInTables(fileLen);
}
function fetchRecords(searchField) {
    //if("none"==$("#SignerDiv"+rowCounter).css("display")){
    var rowNumber = searchField.id.split("_")[1];
    //populateUserUI(userArray,rowNumber);
    //copySecondaryRecordsData = userArray;
    copySecondaryRecordsData = [];
    var text = $("#searchField_" + rowNumber).val();
    if (text.length > 2) {
        for (i = 0; i < userArray.length; i++) {
            user_email = userArray[i].email;
            user_Fullname = userArray[i].full_name;
            if (user_email.toUpperCase().includes(text.toUpperCase()) || user_Fullname.toUpperCase().includes(text.toUpperCase())) {
                copySecondaryRecordsData.push(userArray[i]);
            }
        }
        clearTimeout(timeout);
        timeout = setTimeout(function () {
            populateUserSelect(rowNumber);
        }, 500);
    }

}
function fetchRecordsOld(searchField) {

    var rowNumber = searchField.id.split("_")[1];
    var text = $("#searchField_" + rowNumber).val();
    if (text.length > 3) {
        clearTimeout(timeout);
        timeout = setTimeout(function () {
            Promise.all([ZOHO.CRM.API.searchRecord({
                Entity: "Contacts",
                Type: "word",
                Query: text
            }), ZOHO.CRM.API.searchRecord({
                Entity: "Leads",
                Type: "word",
                Query: text
            })]).then(function (response) {
                populateUI(response, rowNumber);
            });

        }, 500); // Change this to delay the requests
    }
}
function generateFields(recipientResp, docIdList) {
    var newReciep = [];
    var documentId = docIdList[0].document_id;
    var len = recipientResp.actions.length;
    /*
    var signXaxis = 99;
    var signYaxis = 3;

    var emailXaxis = 4;
    var emailYaxis = 3;
    var tempJson1 = {};
    tempJson1.fields=[{"abs_height":40,"abs_width":65,"action_id":"27074000000274056","description_tooltip":"","document_id":"27074000000277019","field_category":"image","field_label":"Signature","field_name":"Signature","field_type_id":"27074000000000141","is_mandatory":true,"page_no":0,"x_coord":99,"y_coord":3},{"abs_height":40,"abs_width":65,"action_id":"27074000000274056","default_value":"","description_tooltip":"","document_id":"27074000000277019","field_category":"textfield","field_label":"Email","field_name":"Email","field_type_id":"27074000000000149","is_mandatory":true,"page_no":0,"text_property":{"font":"Arial","font_color":"000000","font_size":11,"is_bold":false,"is_italic":false,"is_read_only":false,"is_underline":false},"x_coord":4,"y_coord":3}];
    */
    for (var _i = 0; _i < len; _i++) {
        var tempJson = {};
        //tempJson = tempJson1;
        var actionVar = {};
        actionId = recipientResp.actions[_i].action_id;
        actionVar.action_id = actionId;
        actionVar.action_type = recipientResp.actions[_i].action_type;
        actionVar.deleted_fields = [];
        actionVar.private_notes = "";
        actionVar.signing_order = recipientResp.actions[_i].signing_order;
        actionVar.verify_recipient = recipientResp.actions[_i].verify_recipient;
        /*
        tempJson.fields[0].y_coord=signYaxis;
        tempJson.fields[1].y_coord=emailYaxis;
        signYaxis = signYaxis + 60;
        emailYaxis = emailYaxis + 60;

        for(var j=0;j<tempJson.fields.length;j++){
            tempJson.fields[j].action_id = actionId;
            tempJson.fields[j].document_id = documentId;

        }
        */
        //actionVar.fields=tempJson.fields;
        newReciep.push(actionVar);
    }

    return newReciep;
    //tempJson.fields = {"image_fields":[{"abs_height":59,"abs_width":99,"action_id":"27074000000274056","description_tooltip":"","document_id":"27074000000277019","field_category":"image","field_label":"Signature","field_name":"Signature","field_type_id":"27074000000000141","is_mandatory":true,"page_no":0,"x_coord":42,"y_coord":3}],"radio_groups":{},"text_fields":[{"abs_height":59,"abs_width":99,"action_id":"27074000000274056","default_value":"","description_tooltip":"","document_id":"27074000000277019","field_category":"textfield","field_label":"Email","field_name":"Email","field_type_id":"27074000000000149","is_mandatory":true,"page_no":0,"text_property":{"font":"Arial","font_color":"000000","font_size":11,"is_bold":false,"is_italic":false,"is_read_only":false,"is_underline":false},"x_coord":4,"y_coord":3}]};
    //{"fields":[{"abs_height":59,"abs_width":99,"action_id":"27074000000274056","description_tooltip":"","document_id":"27074000000277019","field_category":"image","field_label":"Signature","field_name":"Signature","field_type_id":"27074000000000141","is_mandatory":true,"page_no":0,"x_coord":42,"y_coord":3},{"abs_height":59,"abs_width":99,"action_id":"27074000000274056","default_value":"","description_tooltip":"","document_id":"27074000000277019","field_category":"textfield","field_label":"Email","field_name":"Email","field_type_id":"27074000000000149","is_mandatory":true,"page_no":0,"text_property":{"font":"Arial","font_color":"000000","font_size":11,"is_bold":false,"is_italic":false,"is_read_only":false,"is_underline":false},"x_coord":4,"y_coord":3}]}
}
function generateActions(updateDataGenerator, signOrderSet) {
    hostNameisNone = false;
    // debugger;
    var actions = [];
    var secondaryRecords = $.find("[id*='tr_row_']");
    for (var _i = 0; _i < secondaryRecords.length; _i++) {
        var currentDivRowId = secondaryRecords[_i].id.split("_")[3];
        var rowNumber = secondaryRecords[_i].id.split("_")[2];
        displayVal = $("#emailRecip_" + rowNumber).css("display");
        var tempJson = {};
        /*
        tempJson.subject="$SENDER_NAME$ from $ORG_NAME$ requests you to sign $DOCUMENT_NAME$ !!";
        tempJson.mail_template="<div class=\"container\" style=\"width: 100% !important; line-height: 1.6em; font-size: 14px; background-color: rgb(246, 246, 246); padding-top: 20px\"><table style=\"background-color: rgb(246, 246, 246); width: 600px; margin: 0 auto !important\"><tbody><tr><td><br></td><td style=\"display: block !important; width: 600px !important; margin: 0 auto !important; clear: both !important\" class=\"templateColumns\"><div style=\"margin: 0 auto; display: block\"><table style=\"background-color: rgb(255, 255, 255)\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\"><tbody><tr><td style=\"font-size: 16px; font-weight: 500; padding: 20px; line-height: 18px; background-color: rgb(255, 255, 255)\"><img src=\"$LOGO_URL$\" id=\"ztb-logo-rebrand\" style=\"max-height: 50px\"><br></td></tr><tr><td><table width=\"100%\" align=\"center\" cellpadding=\"10\" cellspacing=\"0\" style=\"background-color: rgb(81, 210, 182)\"><tbody><tr><td style=\"color: rgb(255, 255, 255); font-size: 16px; font-family: Helvetica, Arial, Sans Serif; border: none; background-color: rgb(81, 210, 182); padding: 20px; height: 28px\" class=\"header-row\"><div style=\"text-align: left; float: left; line-height: normal; padding: 0px 0 0 10px; display: inline-block; font-size: 24px; width: 100%\" class=\"sign-mail-header\">Digital Signature Request<br></div></td></tr></tbody></table></td></tr><tr><td style=\"padding: 25px 40px 0px 40px\"><table width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"padding-bottom: 20px\"><tbody style=\"font-size: 14px; color: rgb(68, 68, 68); line-height: 20px\"><tr><td style=\"padding: 0 0 20px; font-size: 14px\" class=\"message-row\"><div class=\"sign-mail-message\" style=\"word-wrap: break-word; width: 100%; float: left\"><span>$SENDER_NAME$ has requested you to review and sign $DOCUMENT_NAME$</span><br></div></td></tr><tr><td><table style=\"width: 100%; table-layout: fixed\"><tbody><tr width=\"520px\" style=\"height: 30px; line-height: 30px; font-size: 14px\"><td width=\"35%\" style=\"font-weight: 600\">Sender<br></td><td style=\"width: 335px; text-overflow: ellipsis; overflow: hidden; white-space: nowrap\">$SENDER_EMAIL$<br></td></tr><tr width=\"520px\" style=\"height: 30px; line-height: 30px; font-size: 14px\"><td width=\"35%\" style=\"font-weight: 600\">Organization Name<br></td><td style=\"width: 335px; text-overflow: ellipsis; overflow: hidden; white-space: nowrap\">$ORG_NAME$<br></td></tr><tr width=\"520px\" style=\"height: 30px; line-height: 30px; font-size: 14px\"><td width=\"35%\" style=\"font-weight: 600\">Expires on<br></td><td style=\"width: 335px; text-overflow: ellipsis; overflow: hidden; white-space: nowrap\">$EXPIRY_DATE$<br></td></tr><tr width=\"520px\" style=\"height: 30px; line-height: 30px; font-size: 14px; vertical-align: top\"><td width=\"35%\" style=\"font-weight: 600\">Message to all<br></td><td>$NOTE$<br></td></tr></tbody></table></td></tr></tbody></table></td></tr><tr><td style=\"padding: 0 0 20px\"><table width=\"100%\"><tbody><tr><td align=\"center\" style=\"padding-top: 15px\"><div><table><tbody><tr><td align=\"center\" style=\"font-size: 15px; color: rgb(255, 255, 255); background-color: rgb(232, 78, 88); text-align: center; text-decoration: none; border-radius: 2px; display: inline-block; min-height: 38px\" class=\"button-row\"><a class=\"sign-mail-btn-link\" href=\"$LINK_TO_SIGN$\" style=\"font-size: 18px; color: rgb(255, 255, 255); text-align: center; text-decoration: none; border-radius: 3px; display: inline-block; padding: 0px 30px; float: left\" rel=\"noopener noreferrer\" target=\"_blank\"><div style=\"line-height: 38px; font-size: 18px\" class=\"sign-mail-btn-text\">Start Signing<br></div></a></td></tr></tbody></table></div></td></tr></tbody></table></td></tr></tbody></table></div></td><td><br></td></tr></tbody></table><div class=\"disclaimer-container\" style=\"background-color: #f6f6f6;width: 600px;padding: 10px 0px 20px 0px;margin: 0 auto;\">$FOOTER_CONTENT$</div></div><div><br></div><style type=\"text/css\">@media only screen and (max-width: 480px) {.templateColumns { width: 100% !important } }<br></style>";
        
        tempJson.subject="$SENDER_NAME$ from $ORG_NAME$ requests your signature";
        tempJson.mail_template="<div class=\"container\" style=\"width: 100% !important; line-height: 1.6em; font-size: 14px; background-color: rgb(246, 246, 246); padding-top: 20px\"><table style=\"background-color: rgb(246, 246, 246); width: 600px; margin: 0 auto !important\"><tbody><tr><td><br></td><td style=\"display: block !important; width: 600px !important; margin: 0 auto !important; clear: both !important\" class=\"templateColumns\"><div style=\"margin: 0 auto; display: block\"><table style=\"background-color: rgb(255, 255, 255)\" width=\"100%\" cellpadding=\"0\" cellspacing=\"0\"><tbody><tr><td style=\"font-size: 16px; font-weight: 500; padding: 20px; line-height: 18px; background-color: rgb(255, 255, 255)\"><img src=\"$LOGO_URL$\" id=\"ztb-logo-rebrand\" style=\"max-height: 50px\"><br></td></tr><tr><td><table width=\"100%\" align=\"center\" cellpadding=\"10\" cellspacing=\"0\" style=\"background-color: rgb(81, 210, 182)\"><tbody><tr><td style=\"color: rgb(255, 255, 255); font-size: 16px; font-family: Helvetica, Arial, Sans Serif; border: none; background-color: rgb(81, 210, 182); padding: 20px; height: 28px\" class=\"header-row\"><div style=\"text-align: left; float: left; line-height: normal; padding: 0px 0 0 10px; display: inline-block; font-size: 24px; width: 100%\" class=\"sign-mail-header\">Digital Signature Request<br></div></td></tr></tbody></table></td></tr><tr><td style=\"padding: 25px 40px 0px 40px\"><table width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"padding-bottom: 20px\"><tbody style=\"font-size: 14px; color: rgb(68, 68, 68); line-height: 20px\"><tr><td style=\"padding: 0 0 20px; font-size: 14px\" class=\"message-row\"><div class=\"sign-mail-message\" style=\"word-wrap: break-word; width: 100%; float: left\"><span>$SENDER_NAME$ from $ORG_NAME$ has requested you to review and sign $DOCUMENT_NAME$ this document</span><br></div></td></tr><tr><td><table style=\"width: 100%; table-layout: fixed\"><tbody><tr width=\"520px\" style=\"height: 30px; line-height: 30px; font-size: 14px\"><td width=\"35%\" style=\"font-weight: 600\">Sender<br></td><td style=\"width: 335px; text-overflow: ellipsis; overflow: hidden; white-space: nowrap\">$SENDER_EMAIL$<br></td></tr><tr width=\"520px\" style=\"height: 30px; line-height: 30px; font-size: 14px\"><td width=\"35%\" style=\"font-weight: 600\">Organization Name<br></td><td style=\"width: 335px; text-overflow: ellipsis; overflow: hidden; white-space: nowrap\">$ORG_NAME$<br></td></tr><tr width=\"520px\" style=\"height: 30px; line-height: 30px; font-size: 14px\"><td width=\"35%\" style=\"font-weight: 600\">Expires on<br></td><td style=\"width: 335px; text-overflow: ellipsis; overflow: hidden; white-space: nowrap\">$EXPIRY_DATE$<br></td></tr><tr width=\"520px\" style=\"height: 30px; line-height: 30px; font-size: 14px; vertical-align: top\"><td width=\"35%\" style=\"font-weight: 600\">Message to all<br></td><td>$NOTE$<br></td></tr></tbody></table></td></tr></tbody></table></td></tr><tr><td style=\"padding: 0 0 20px\"><table width=\"100%\"><tbody><tr><td align=\"center\" style=\"padding-top: 15px\"><div><table><tbody><tr><td align=\"center\" style=\"font-size: 15px; color: rgb(255, 255, 255); background-color: rgb(232, 78, 88); text-align: center; text-decoration: none; border-radius: 2px; display: inline-block; min-height: 38px\" class=\"button-row\"><a class=\"sign-mail-btn-link\" href=\"$LINK_TO_SIGN$\" style=\"font-size: 18px; color: rgb(255, 255, 255); text-align: center; text-decoration: none; border-radius: 3px; display: inline-block; padding: 0px 30px; float: left\" rel=\"noopener noreferrer\" target=\"_blank\"><div style=\"line-height: 38px; font-size: 18px\" class=\"sign-mail-btn-text\">Start Signing<br></div></a></td></tr></tbody></table></div></td></tr></tbody></table></td></tr></tbody></table></div></td><td><br></td></tr></tbody></table><div class=\"disclaimer-container\" style=\"background-color: #f6f6f6;width: 600px;padding: 10px 0px 20px 0px;margin: 0 auto;\">$FOOTER_CONTENT$</div></div><div><br></div><style type=\"text/css\">@media only screen and (max-width: 480px) {.templateColumns { width: 100% !important } }<br></style>";
        */

        var displayTextName;
        var displayTextEmail;
        var chosenValue;
        // debugger;
        if (displayVal != "none") {
            displayTextEmail = $("#recipientMail_" + rowNumber).val();
            displayTextName = $("#recipientName_" + rowNumber).val();

            if (displayTextEmail == "") {
                alert("invalid emailId");
                toggleGIF();
                disableLoader();
            }
            if (displayTextName == "") {
                displayTextName = displayTextEmail.split("@")[0];
            }
            displayTextName = displayTextName.replaceAll("\"", "");
            displayTextName = displayTextName.replaceAll("\'", "");
            tempJson.recipient_name = displayTextName;
            tempJson.recipient_email = displayTextEmail.includes("@") ? displayTextEmail : "";
            var secondarySignerRole = $("#signerRole_row_" + rowNumber + "_" + currentDivRowId);
            chosenValue = secondarySignerRole[0].options[secondarySignerRole[0].selectedIndex].value.toUpperCase();
            tempJson.action_type = chosenValue;
        } else {
            var test1 = $("#select_row_" + rowNumber + "_" + currentDivRowId).chosen().val().split("}")[0];
            displayTextName = test1.replace("{", "");
            var test2 = $("#select_row_" + rowNumber + "_" + currentDivRowId).chosen().val().split("}")[1];
            displayTextEmail = test2.trim();  // Gowtham un comment this line later after development
            // displayTextEmail = 'gowtham.purushoth@zohocorp.com';

            displayTextName = displayTextName.replaceAll("\"", "");
            displayTextName = displayTextName.replaceAll("\'", "");
            tempJson.recipient_name = displayTextName;
            tempJson.recipient_email = displayTextEmail.includes("@") ? displayTextEmail : "";
            var secondarySignerRole = $("#signerRole_row_" + rowNumber + "_" + currentDivRowId);
            chosenValue = secondarySignerRole[0].options[secondarySignerRole[0].selectedIndex].value.toUpperCase();
            tempJson.action_type = chosenValue;
        }
        //debugger;
        if (chosenValue == "INPERSONSIGN") {
            tempJson.in_person_email = displayTextEmail.includes("@") ? displayTextEmail : "";
            tempJson.in_person_name = displayTextName;
            zsignUser = $("#select_zsuser_row_" + rowNumber).find(":selected").text();
            if (zsignUser == '--None--') {
                hostNameisNone = true;
                document.getElementById('Host_' + rowNumber).innerText = 'Please enter the value for Host name';
            }
            tempJson.recipient_name = zsignUser.split("{")[1];
            tempJson.recipient_email = zsignUser.split("{")[0];
        }

        var deliveryMode = $("#signerDeliveryMode_row_" + rowNumber).val();
        console.log(deliveryMode);
    if(deliveryMode === 'EMAIL_SMS'){
        tempJson.delivery_mode = 'EMAIL_SMS';
        var countryCode = $("#countryVal" + rowNumber).val();
        if(countryCode === "none"){
            document.getElementById('requiredCountryCode' + rowNumber).innerText = 'Please enter the value for Country Code';
        }else {
            document.getElementById('requiredCountryCode' + rowNumber).innerText = '';
        }
        var phoneNum = $("#phoneNumberVal" + rowNumber).val();
        if(phoneNum.length == 0){
            document.getElementById('requiredPhonenumber' + rowNumber).innerText = 'Please enter the value for Phone Number';
        }else {
            if(!isNaN(phoneNum)){
                document.getElementById('requiredPhonenumber' + rowNumber).innerText = '';
                document.getElementById('inValidPhonenumber' + rowNumber).innerText = '';
                tempJson.recipient_phonenumber = phoneNum;
            }else {
                document.getElementById('inValidPhonenumber' + rowNumber).innerText = 'Please enter the valid Phone Number';
                document.getElementById('requiredPhonenumber' + rowNumber).innerText = '';
            }
        }
        
        tempJson.recipient_countrycode = countryCode; 
     }else {
        tempJson.delivery_mode = 'EMAIL';
     }

        
        if (signOrderSet) {
            var orderStr = $("#signOrder_row_" + rowNumber + "_" + currentDivRowId).val();
            if (isNormalInteger(orderStr)) {
                tempJson.signing_order = orderStr;
            } else {
                tempJson.signing_order = "1";
            }

        }
        actions[_i] = tempJson;
        recipients[currentDivRowId] = displayTextName + "&" + displayTextEmail + "&" + $("#signOrder_row_" + rowNumber + "_" + currentDivRowId).val() + "&" + chosenValue;

    }
    updateDataGenerator.actions = actions;
}
Utils.RenderTemplate = function (templateId, data, divId, callBack) {

    var template = $("#" + templateId).html();
    if (template == undefined) {

        $("." + divId + ", .bg").show();
    } else {
        var compiledTemplate = Handlebars.compile(template);
        var widgetsDiv = $("." + divId);
        widgetsDiv.html(compiledTemplate(data));
        if (callBack) {
            callBack();
            // $('#open-folderinBox').show();
            $("." + divId).show();
        }
    }

};
Utils.hideLoading = function () {
    $("#loadingDiv").hide();
}
Utils.moveToolTip = function (obj) {

    var thumbNailImg = $($(obj).find("img")[0])
    $(thumbNailImg).css({ top: mousePos.getY() + 15, left: mousePos.getX() + 15 });

}
function isNormalInteger(str) {
    var n = Math.floor(Number(str));
    return n !== Infinity && String(n) === str && n > 0;
}
function chooseFile(downloadURL, fileName, fileType) {
    if (downloadURL != undefined && downloadURL != null) {
        rId = downloadURL.split("=")[1];
        console.log("Inside chooseFile( Select From Document )!");



        var testReq = {
            //url : "http://eapp.docs.localzohoplatform.com/api/v2/files/download",
            url: "http://e360crm.docs.zohoplatform.com/api/v2/files/download",
            params: {
                resourceId: rId,
            },
            headers: {
                Authorization: DocsAuthToken,
            },
            RESPONSE_TYPE: "stream"
        };
        ZOHO.CRM.HTTP.get(testReq).then(function (data) {
            console.log(data);
            // var a = document.createElement("a");
            // url = window.URL.createObjectURL(data); a.href = url; a.download = "naresh.docx"; a.click(); window.URL.revokeObjectURL(url);
            fileStream = data;
            fileStream.name = $(".appText").text();
        });

        //var fileName = document.getElementById("file").files[0].name;
        $(".appText").html(fileName);
        $("#docuName").val(fileName);
        $(".fileUploadFromDocs, .bg").hide();
        //$(".bg").css("background","#fff");
        //$(".bg").css("z-index","0");


    } else {
        alert("Can't upload the file! Please Try again later!");
    }

}
function cancelPopup() {

    console.log("cancelPopup :: ");
    $(".bg").hide();
    $(".fileFromMailMerge").hide();
    $(".fileUploadFromDocs").hide();
    //$("."+_this).hide();
    //$("#file").text(" ");
    //$(".bg").hide();
}
function closes() {
    var modals = document.getElementById("myModals");
    modals.style.display = "none";
}
window.onclick = function (event) {
    var modals = document.getElementById("myModals");
    if (event.target == modals) {
        modals.style.display = "none";
    }
}
function attachments() {
    totalAttachments = [];
    var imgurl = '';
    var modals = document.getElementById("myModals");
    var checkboxes = document.getElementById("checkboxes");
    modals.style.display = "block";
    ZOHO.CRM.API.getRelatedRecords({ Entity: data.pageLoadData.Entity, RecordID: data.pageLoadData.EntityId[0], RelatedList: "Attachments", page: 1, per_page: 200 })
        .then(function (data) {
            console.log(data.data);
            if (data?.data?.length > 0) {
                var tempList = [];
                var attachmentsArray = '';
                for (i = 0; i < data?.data?.length; i++) {
                    if (data.data[i].File_Name.includes('[Completed] ') == false) {
                        tempList.push({ "Id": data.data[i].id, "Name": data.data[i].File_Name, 'fileId': data.data[i]['$file_id'] });
                        if (data.data[i].File_Name.split('.')[1] == 'docx' || data.data[i].File_Name.split('.')[1] == 'doc' || data.data[i].File_Name.split('.')[1] == 'zdoc') {
                            imgurl = '../images/docx.webp';
                        } else if (data.data[i].File_Name.split('.')[1] == 'png' || data.data[i].File_Name.split('.')[1] == 'jpeg' || data.data[i].File_Name.split('.')[1] == 'jpg' || data.data[i].File_Name.split('.')[1] == 'webp') {
                            imgurl = '../images/image.png';
                        } else if (data.data[i].File_Name.split('.')[1] == 'pdf') {
                            imgurl = '../images/pdf-removebg-preview.png';
                        } else {
                            imgurl = '../images/docx.webp';
                        }
                        attachmentsArray = attachmentsArray + `<label for="${data.data[i].id}" ><input style="margin: 5px;" type="checkbox"  id="${data.data[i].id}" onclick="addAttach();" value="${data.data[i].id}" /><img src="${imgurl}" alt="icon" style="width:20px;height:20px;">${data.data[i].File_Name}</label>`
                    }
                }
                totalAttachments = tempList;
                checkboxes.innerHTML = attachmentsArray;
            }
        })
};

function addAttachments() {
    var modals = document.getElementById("myModals");
    if (newAttachment.length > 0) {
        modals.style.display = "none";
        var body = '';
        fileLen = [...fileLen, ...newAttachment];
        if (fileLen.length > 0) {
            $(".appText").html('One or more files added.');
            for (j = 0; j < fileLen.length; j++) {
                if (fileLen[j]['Name'] != undefined) {
                    var fileName = fileLen[j]['Name'].split('.')[0];
                    var fileType = fileLen[j]['Name'].split('.')[1];
                    body = body + `<tr><td>${fileName}</td> <td> ${fileType} </td> <td class="pR oH"><a href="javascript:;" onclick="deleteAttachments('${fileName}')" class="delete">Remove</a></td>`
                } else if (fileLen[j]['name'] != undefined) {
                    var fileType = fileLen[j].name.split('.');
                    console.log(fileType[fileType.length - 1]);
                    body += `<tr><td>${fileType[0]}</td> <td> ${fileType[fileType.length - 1]} </td> <td class="pR oH"><a href="javascript:;" onclick="deleteFiles(${j})" class="delete">Remove</a></td>`
                }
            }
            document.getElementById('documentRecords').innerHTML = body;
        } else if (fileLen.length == 0) {
            $(".appText").html('One or more files added.');
        }
    } else {
        modals.style.display = "block";
    }
    console.log(fileLen);
}

var expanded = false;
function showCheckboxes() {
    var checkboxes = document.getElementById("checkboxes");
    if (!expanded) {
        checkboxes.style.display = "block";
        expanded = true;
    } else {
        checkboxes.style.display = "none";
        expanded = false;
    }
}

function blobToFile(theBlob, fileName) {
    //A Blob() is almost a File() - it's just missing the two properties below which we will add
    theBlob.lastModifiedDate = new Date();
    theBlob.name = fileName;
    return theBlob;
}

function addAttach() {
    newAttachment = [];
    for (i = 0; i < totalAttachments.length; i++) {
        var ischecked = document.getElementById(totalAttachments[i]['Id']).checked;
        if (ischecked) {
            newAttachment.push(totalAttachments[i]);
        }
    }
    console.log(newAttachment);
}

function showCheckboxesMM() {
    var checkboxes = document.getElementById("checkboxesMM");
    if (!expanded) {
        checkboxes.style.display = "block";
        expanded = true;
    } else {
        checkboxes.style.display = "none";
        expanded = false;
    }
}
function closesMM() {
    var modals = document.getElementById("mailMergeModal");
    modals.style.display = "none";
}

function getMailMergeTemplatesNew() {

    if (data.pageLoadData.Entity == 'Quotes' || data.pageLoadData.Entity == 'Purchase_Orders') {
        getInventoryTemplatesNew();
    } else {
        var modals = document.getElementById("mailMergeModal");
        var checkboxes = document.getElementById("checkboxesMM");
        modals.style.display = "block";
        params = { "module": data.pageLoadData.Entity };
        ZOHO.CRM.FUNCTIONS.execute(configData.customFunctions.getMMTemplates, params).then(function (data) {
            var selectOptionsMM = '';
            console.log(data);
            code = data.code;
            if ("success" == code) {
                var templateData = {};
                output = data.details.output;
                console.log(output);
                var jsonResp = JSON.parse(output);
                templatesSize = jsonResp.templates.length;
                if (templatesSize > 0) {
                    document.getElementById('notemplateFound').style.display = "none";

                    var tempList = [];
                    selectOptionsMM = '<select onchange="getMailMergeValue()" id="gow"> <option>Select an option</option>';
                    for (i = 0; i < templatesSize; i++) {
                        tempList.push({ "Id": jsonResp.templates[i].id, "Name": jsonResp.templates[i].name });
                        selectOptionsMM = selectOptionsMM + `<option value="${jsonResp.templates[i].id}">${jsonResp.templates[i].name}</option>`
                    }
                    selectOptionsMM = selectOptionsMM + '</select>';
                    templateData = {
                        files: tempList
                    }
                    checkboxes.innerHTML = selectOptionsMM;
                } else {
                    document.getElementById('notemplateFound').style.display = "block";
                    document.getElementById('notemplateFound').innerHTML = 'No Mail Merge template found for this module';
                }

            }
        }, function (err) {
            $(".file-box").text("You need API and Workflow Permissions to fetch Mail Merge templates, Please contact your administrator");
        });
    }
}

function getInventoryTemplatesNew() {
    var modals = document.getElementById("mailMergeModal");
    var checkboxes = document.getElementById("checkboxesMM");
    modals.style.display = "block";
    params = { "module": data.pageLoadData.Entity };
    ZOHO.CRM.FUNCTIONS.execute(configData.customFunctions.getInventoryTemplates, params).then(function (data) {
        console.log(data);
        code = data.code;
        if ("success" == code) {
            var templateData = {};
            output = data.details.output;
            console.log(output);
            var selectOptionsMM = '';

            var resp = JSON.parse(output);
            jsonResp = JSON.parse(resp.response)
            templatesSize = jsonResp.inventory_templates.length;
            if (templatesSize > 0) {
                var tempList = [];//jsonResp.templates;
                var jsonObj = {};
                selectOptionsMM = '<select onchange="getMailMergeValue()" id="gow"> <option>Select an option</option>';
                for (i = 0; i < templatesSize; i++) {
                    tempList.push({ "Id": jsonResp.inventory_templates[i].id, "Name": jsonResp.inventory_templates[i].name });
                    selectOptionsMM = selectOptionsMM + `<option value="${jsonResp.inventory_templates[i].id}">${jsonResp.inventory_templates[i].name}</option>`
                }
                selectOptionsMM = selectOptionsMM + '</select>';
                templateData = {
                    files: tempList
                }
                checkboxes.innerHTML = selectOptionsMM;
            }
        }
    }, function (err) {
        var templateData = {};
        $(".file-box").text("You need API and Workflow Permissions to fetch Mail Merge templates, Please contact your administrator");
    });

}


