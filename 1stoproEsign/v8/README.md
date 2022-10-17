# verticalSign

This version got minor changes in the widgetTrigger.js line no.299, 328 and line no. 1503 to 1506. 

Changes : Replaced the ()open/close parenthesis used in addRecipient() with curly braces{} functions to segragate the Recipient name from the Recipient email address. 

FIX : This will fix the issue with updateRecipientdata api "Error in Updaterecipient" occurs when hypen is used in the email address of the recipient. 


## Recent Update on 2/Nov/2021 v5

This code file WidgetTrigger.js has code fixes for hyphen issue in all 3 cases. 
#. FirstRow Recipient(Deal/Contact record) Ln#299, 328 and  1503, 1505. 
##. Additional recipients(CRM-ZSignUsers) Ln#427, 426, and 1503, 1505. 
###. Host User(ZSignuser) for Inperson mode.(Ln # 1525,1526 and Ln# 551),


## Recent update on 26th May 2022 - V6

This code includes the following enhancements and bug . 
Enhancements :
#. Multiple Files upload from Desktop and Mail Merge and Inventory Template options. 
##. Option to check available Documents Limit for Sign Request in the widget UI. 
###. Sign Request completion certificate can be downloaded from Sign Documents Record. 
####. Document Request Name will be populated automatically based on first file uploaded. 

Bug Fixes :
#. zdoc files upload failure is fixed by converting the .zdoc to .docx format in the code. 
##. attachments were failing to upload after sign request completion for the Mail Merge files, which is fixed all files will get uploaded in attachments under sign document with [Completed] tag appended to the file name. 
###. Default recipient in request which has - hyphens in the Name and Email address concatenation was not added to the sign document related list, which is fixed at code level. 

Bugs yet to be fixed: 
There are two  scenarios of same issues. 
1. When default recipient is removed, Clicking on mail merge causes Jquery breakage. 
2. Similarly when recipient section has a InPerson Signer entry and then MailMerge file is selected, then again the jquery breakage occurs.
3. Add Recipients and User Search in the recipient section fails with Jquery breakage, once a jquery breakage occurs. 

Enhancements to be done : 

1. upload Files from the crm record attachments section in "Send for Sign" widget. 
2. The Loading Messages at the top should indicate some successful completion of the sign with some tick mark etc. 


## Recent Udpate on 16 Jun 2022 - v6.1

UI Enhancments : 
1. The loading GIF in Save button has been removed
2. Instead the Loading bar GIF is added at the center of the UI
3. Success Pop up UI is included to indicate successful completion of the SignRequest. 

Bug Fixes : 
Download Document connector api was missing in config.json file, which is included to solve the Sign Recipient and Sign Event record failure issue upon Sign Request call completion. 

## Recent Udpate on 6 July 2022 - v6.2
This Version of Esign has been done to 1stop Install app. 
*Difference betwee v6.1 and v6.2 
1. Esign Button is added to the Quotes and Purchase Order modules. 

## Recent Update on  19th Jul 2022 - v7
This Version of Esign has been done to 1stopro Vertical App . 

Feature Enahncements :
1. CRM Attachments : New Source of File Upload has been included in this version. 
        The Select Files Dialogue is built separately using the JS and HTML and CSS without any jquery plugin unlike in the Use Mail Merge template case. 

        The Files that're already completed with sign will be excluded while uploading Files for ESign. 


## Recent Update on 29th Jul 2022 - v7.1
1. This version of Esign has been done to 1stopro Vertical App  first. - but it is a common update for all partners. 

Enhancements and Bug Fixes : 
1. The Custom Dialouge for Choose Mail Merge Template has been added to replace the old dialogue pop up for Mail Merge which was using Choose Jquery oplugin. The new Dialogue for Choose Mail Merge does not include any third party library. 


## Recent Update on 5th Aug 2022 - v8
1. This update includes custom popup for uploading mail merge template, removed 3rd party Jquery Plugin and popup's created by Harry. 
2. Added new tab for attachments - User can upload the doc (files) from attachments.
3. Added new fields for the user to select "Email" / "Email_SMS" options. The msg will triggered when the user select "Email & SMS" options.
4. Sign Call Back Deulge Function has been optimized to find the Module Look up associated with the Sign Documents record, 
5. CRM Variable is added to maintain the list of ModuleAPIName vs LookUpAPI name in the sign documents module. 
