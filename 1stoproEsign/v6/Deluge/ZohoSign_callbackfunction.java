// sendmail
// [
// 	from :zoho.adminuserid
// 	to :"anilkumar.g@zohotest.com"
// 	subject :"1stopro crm! SignCallbackFlow!"
// 	message :crmAPIRequest.toString()
// ]
info "zohosign info";
resp = zoho.crm.invokeConnector("crm.modulesmeta",Map()).toString().toMap();
responseObj = resp.get("response").toMap();
modules = responseObj.get("modules").toJSONList();
zohoSignDocumentsEvents = "";
zohoSignDocuments = "";
zohoSignRecipients = "";
curDate = zoho.currentdate;
info "inside zohosigncallback method";
for each  module in modules
{
	currentModuleMap = module.toMap();
	if(currentModuleMap.get("api_name").equalsIgnoreCase("ZohoSign_Document_Events"))
	{
		zohoSignDocumentsEvents = currentModuleMap.get("module_name");
	}
	if(currentModuleMap.get("api_name").equalsIgnoreCase("ZohoSign_Documents"))
	{
		zohoSignDocumentsEvents = currentModuleMap.get("module_name");
	}
	if(currentModuleMap.get("api_name").equalsIgnoreCase("ZohoSign_Recipients"))
	{
		zohoSignDocumentsEvents = currentModuleMap.get("module_name");
	}
}
inputMap = crmAPIRequest.get("body");
reqMap = inputMap.toMap();
documents = reqMap.get("document_ids").toJSONList();
documentStatus = reqMap.get("request_status");
requestId = reqMap.get("request_id");
documentNotes = reqMap.get("notes");
documentDescription = reqMap.get("description");
currentNotification = reqMap.get("notifications").toMap();
documentIds = List();
//orgVar = zoho.crm.getOrgVariable("AuthToken");
//info "orgVar :: " + orgVar;
currentNotifiedEmail = currentNotification.get("performed_by_email");
activityVal = currentNotification.get("activity");
if(activityVal.isNull() || activityVal.isEmpty())
{
	activityVal = "";
}
operation_type = currentNotification.get("operation_type");
if(operation_type.isNull() || operation_type.isEmpty())
{
	operation_type = "";
}
info "performed_by_email is : " + currentNotifiedEmail;
for each  currentDocument in documents
{
	currentDocumentMap = currentDocument.toMap();
	currentDocumentId = currentDocumentMap.get("document_id");
	currentDocumentName = currentDocumentMap.get("document_name");
	documentIds.add(currentDocumentId);
	contact_Id = "";
	deals_Id = "";
	contract_Id = "";
	mp = {"module":"ZohoSign_Documents","criteria":"ZohoSign_Document_ID:equals:" + currentDocumentId};
	zohoSignDocumentSearchRecord = zoho.crm.invokeConnector("crm.search",mp).toString().toMap();
	if(zohoSignDocumentSearchRecord.get("response") != null && zohoSignDocumentSearchRecord.get("response").length() > 3)
	{
		zohoSignDocumentSearchRecord = zohoSignDocumentSearchRecord.get("response").toMap();
		zohoSignDocumentSearchRecord = zohoSignDocumentSearchRecord.get("data").toJSONList().toString().toMap();
		searchDocumentId = zohoSignDocumentSearchRecord.get("id");
		deals = zohoSignDocumentSearchRecord.get("Deals");
		contract = zohoSignDocumentSearchRecord.get("Contract_Changes");
		curDocumentStatus = zohoSignDocumentSearchRecord.get("Document_Status");
		if("completed".equalsIgnoreCase(curDocumentStatus) || "declined".equalsIgnoreCase(curDocumentStatus))
		{
			info "Document already " + curDocumentStatus + " So completed/declined ending here!";
			// 			sendmail
			// 			[
			// 				from :zoho.adminuserid
			// 				to :"anilkumar.g@zohotest.com"
			// 				subject :"TestCF 1stopro Early EXIT " + curDocumentStatus + " So ending here!"
			// 				message :"Early EXIT -- Sign Document ID is : " + searchDocumentId
			// 			]
			return "Success";
		}
		if(!deals.isNull() && !deals.isEmpty())
		{
			deals_Id = deals.get("id");
		}
		if(!contract.isNull() && !contract.isEmpty())
		{
			contract_Id = contract.get("id");
		}
		contact = zohoSignDocumentSearchRecord.get("Contacts");
		if(!contact.isNull() && !contact.isEmpty())
		{
			contact_Id = contact.get("id");
		}
		/** Main code**/
		if("RequestCompleted RequestExpired RequestLinkEmailed RequestRejected".contains(operation_type))
		{
			//"operation_type" for 'System Generated' --->> RequestLinkEmailed , RequestCompleted, RequestExpired			
			zohoSignDocumentMap = Map();
			zohoSignDocumentMap.put("id",searchDocumentId);
			zohoSignDocumentMap.put("Document_Status",documentStatus.toUpperCase());
			zohoSignDocumentMap.put("Document_Note",documentNotes);
			zohoSignDocumentMap.put("Document_Description",documentDescription);
			if(operation_type.equalsIgnoreCase("RequestCompleted") || operation_type.equalsIgnoreCase("RequestExpired"))
			{
				zohoSignDocumentMap.put("Date_Completed",curDate);
			}
			else if(operation_type.equalsIgnoreCase("RequestExpired"))
			{
				zohoSignDocumentMap.put("Date_Completed",curDate);
			}
			else if(operation_type.equalsIgnoreCase("RequestLinkEmailed"))
			{
				zohoSignDocumentMap.put("Date_Sent",curDate);
				//zohoSignDocumentMap.put("Document_Description","Test FROM LIVE");
			}
			else if(operation_type.equalsIgnoreCase("RequestRejected"))
			{
				zohoSignDocumentMap.put("Date_Declined",curDate);
			}
			zohoSignDocumentList = List();
			zohoSignDocumentList.add(zohoSignDocumentMap);
			updateMap = {"module":"ZohoSign_Documents","data":zohoSignDocumentList};
			info "going to update zohosign_documents module";
			updateResp = zoho.crm.invokeConnector("crm.update",updateMap);
			info "updateRESP :" + updateResp;
			documentsEventsName = currentDocumentName + "-" + documentStatus.toUpperCase();
			if(!operation_type.equalsIgnoreCase("RequestLinkEmailed"))
			{
				zohoSignDocumentEventsMap = Map();
				zohoSignDocumentEventsMap.put("Name",documentsEventsName);
				zohoSignDocumentEventsMap.put("ZohoSign_Documents",searchDocumentId);
				zohoSignDocumentEventsMap.put("Description",documentStatus.toUpperCase());
				zohoSignDocumentEventsMap.put("Date",curDate);
				//zohoSignDocumentEventsMap.put("ZohoSign_Recipients",data.get("id"));
				zohoSignDocumentsEventsList = List();
				zohoSignDocumentsEventsList.add(zohoSignDocumentEventsMap);
				dataMap = {"module":"ZohoSign_Document_Events","data":zohoSignDocumentsEventsList};
				info "going to create ZohoSign_Document_Events module";
				zohoSignDocumentEventsRecord = zoho.crm.invokeConnector("crm.create",dataMap);
			}
		}
		if(operation_type.equalsIgnoreCase("RequestCompleted") || operation_type.equalsIgnoreCase("RequestExpired") || operation_type.equalsIgnoreCase("RequestRejected"))
		{
			for each  currentDocuments in documents
			{
				currentDocMap = currentDocuments.toMap();
				currenDocID = currentDocMap.get("document_id");
				currentDocName = currentDocMap.get("document_name");
				downloadMap = Map();
				downloadMap.put("reqId",requestId);
				downloadMap.put("docId",currenDocID);
				downloadMap.put("$RESPONSE_TYPE$","stream");
				info downloadMap;
				resp = zoho.crm.invokeConnector("zohosign.downloaddocument",downloadMap);
				if(isFile(resp))
				{
					resp.setFileName("[Completed] " + currentDocName + ".pdf");
					attachDoc = zoho.crm.attachFile("ZohoSign_Documents",searchDocumentId,resp);
					if(deals_Id != "")
					{
						attachDoc = zoho.crm.attachFile("Deals",deals_Id,resp);
						info "\n\n Deals Attached " + attachDoc;
					}
					if(contract_Id != "")
					{
						attachDoc = zoho.crm.attachFile("Contract_Changes",contract_Id,resp);
					}
					if(contact_Id != "" && contract_Id == "" && deals_Id == "")
					{
						attachDoc = zoho.crm.attachFile("Contacts",contact_Id,resp);
					}
				}
			}
			// Raise Signal
			if(contact_Id != "")
			{
				contactResp = zoho.crm.getRecordById("Contacts",contact_Id);
				contactEmail = contactResp.get("Email");
				//criteria = "Email:equals:" + contactEmail;
			}
			if(contactEmail.isNull() || contactEmail.isEmpty())
			{
				criteria = "Email:equals:" + zoho.adminuserid;
				zohoRec = zoho.crm.searchRecords("Contacts",criteria);
				info "zohoSearch Record: \n";
				info zohoRec;
				if(zohoRec.isNull() || zohoRec.isEmpty())
				{
					contactEmail = zoho.adminuserid;
					info "No admin record found in CRM(search based on email)!";
					contMap = Map();
					contMap.put("Last_Name","AdminUser");
					contMap.put("Email",zoho.adminuserid);
					contRec = zoho.crm.createRecord("Contacts",contMap);
					info contRec;
				}
				else
				{
					contactEmail = zohoRec.get(0).get("Email");
					info contactEmail;
				}
			}
			// Here create Zoho Notification!
			signalMap = Map();
			signalMap.put("signal_namespace","signal__esignsignal");
			signalMap.put("email",contactEmail);
			signalMap.put("subject","E-Sign " + documentStatus);
			signalMap.put("message","E-Sign has been " + documentStatus + ". Find the document in attachment");
			actionsList = List();
			actionMap = Map();
			actionMap.put("type","link");
			dispName = "E-Sign document! (" + searchDocumentId + ")";
			actionMap.put("display_name",dispName);
			actionMap.put("url","/crm/EntityInfo.do?module=CustomModule14&id=" + searchDocumentId);
			//2970850000000924025");
			actionsList.add(actionMap);
			signalMap.put("actions",actionsList);
			info "\n\n\n Signals Map : " + signalMap;
			result = zoho.crm.invokeConnector("raisesignal",signalMap);
			info result;
			// 			sendmail
			// 			[
			// 				from :zoho.adminuserid
			// 				to :"anilkumar.g@zohotest.com"
			// 				subject :"Signal Response! for 1stopro crm! "
			// 				message :result
			// 			]
		}
	}
}
actions = reqMap.get("actions").toJSONList();
isStatusUpdate = false;
for each  currentUser in actions
{
	currentUserMap = currentUser.toMap();
	currentUserEmail = currentUserMap.get("recipient_email");
	currentUserName = currentUserMap.get("recipient_name");
	actionType = currentUserMap.get("action_type");
	if("INPERSONSIGN".equalsIgnoreCase(actionType))
	{
		inpersonEmail = currentUserMap.get("in_person_email");
		if(inpersonEmail != null && inpersonEmail != "")
		{
			currentUserEmail = currentUserMap.get("in_person_email");
		}
	}
	currentUserActionStatus = currentUserMap.get("action_status");
	for each  documentId in documentIds
	{
		criteria = "((ZohoSign_Document_ID:equals:" + documentId + ") and (Email:equals:" + currentUserEmail + "))";
		mp = {"module":"ZohoSign_Recipients","criteria":criteria};
		zohoSignRecipientsResponse = zoho.crm.invokeConnector("crm.search",mp).toString().toMap();
		if(zohoSignRecipientsResponse.get("response") != null && zohoSignRecipientsResponse.get("response").length() > 3)
		{
			response = zohoSignRecipientsResponse.get("response").toMap();
			if(response.get("data") != null)
			{
				data = response.get("data").toJSONList().toString().toMap();
				updateData = Map();
				updateData.put("id",data.get("id"));
				updateData.put("Recipient_Status",currentUserActionStatus);
				dataList = List();
				dataList.add(updateData);
				updateMap = {"module":"ZohoSign_Recipients","data":dataList};
				info "going to update ZohoSign_Recipients module";
				updateResp = zoho.crm.invokeConnector("crm.update",updateMap);
				info "ZohoSign_Recipients Update : " + updateResp;
				isStatusUpdate = true;
			}
		}
	}
}
if(isStatusUpdate)
{
	// 	sendmail
	// 	[
	// 		from :zoho.adminuserid
	// 		to :"anilkumar.g@zohotest.com"
	// 		subject :"UPDATED!! 1stopro recipient staus updated!"
	// 		message :"1stopro recipient staus updated."
	// 	]
}
return "Success";