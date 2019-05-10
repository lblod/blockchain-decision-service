export const queryStatus = status => `PREFIX sign: <http://mu.semte.ch/vocabularies/ext/signing/>
PREFIX dct: <http://purl.org/dc/terms/>
SELECT ?s ?content ?signatory ?void ?signedResource ?acmIdmSecret
       (GROUP_CONCAT(DISTINCT ?role; SEPARATOR = ',') as ?roles)
WHERE {
  ?s a sign:BlockchainSignature ;
       sign:text ?content ;
       sign:signatory ?signatory ;
       sign:roles ?role;
       sign:externalUserId ?void;
       dct:subject ?signedResource ;
       sign:secret ?acmIdmSecret ;
       sign:status
<http://mu.semte.ch/vocabularies/ext/signing/publication-status/${status}> .
}`;

export const queryNotules = status => `PREFIX ext: <http://mu.semte.ch/vocabularies/ext/>
PREFIX besluit: <http://data.vlaanderen.be/ns/besluit#>
PREFIX prov: <http://www.w3.org/ns/prov#>
PREFIX sign: <http://mu.semte.ch/vocabularies/ext/signing/>
PREFIX dct: <http://purl.org/dc/terms/>

SELECT ?signedResource ?zitting ?content
WHERE {
  GRAPH <http://lblod.info/blockchain> {
    ?signedResource a sign:SignedResource;
                        dct:subject ?zitting;
                        sign:status <http://mu.semte.ch/vocabularies/ext/signing/publication-status/${status}>;
                        sign:text ?content.
  }
}  `;

export const insertQuery = `
PREFIX sign: <http://mu.semte.ch/vocabularies/ext/signing/>
PREFIX dct: <http://purl.org/dc/terms/>

INSERT DATA {
  GRAPH <http://mu.semte.ch/application> {
    <http://data.lblod.info/resources/blockchain/b1b99401-359d-4551-85d3-428bfd239>
        a sign:BlockchainSignature ;
        sign:text "<html><head>...</head><body><h1>Ik ben een besluit</h1></html>" ;
        sign:signatory <http://data.lblod.info/id/persons/8cd78955-680f-4a70-b6db> ;
        sign:roles "GelinktNotuleren_ondertekenaar", "GelinktNotuleren_schrijver" ;
        sign:externalUserId "733bc851-5793-4239-acd3-a63c8fc64de5";
        dct:subject <http://data.lblod.info/resources/besluiten/bea485f8-7bc8-42b> ;
        sign:secret "b994192c-7d2a-4f93-a8e8-2852b81e5e89" ;
        sign:status
  <http://mu.semte.ch/vocabularies/ext/signing/publication-status/unpublished> .
  }
}`;

export const insertById = id => `
PREFIX sign: <http://mu.semte.ch/vocabularies/ext/signing/>
PREFIX dct: <http://purl.org/dc/terms/>

INSERT DATA {
  GRAPH <http://mu.semte.ch/application> {
    <http://data.lblod.info/resources/blockchain/${id}>
        a sign:BlockchainSignature ;
        sign:text "<html><head>...</head><body><h1>Ik ben een besluit</h1></html>" ;
        sign:signatory <http://data.lblod.info/id/persons/8cd78955-680f-4a70-b6db> ;
        sign:roles "GelinktNotuleren_ondertekenaar", "GelinktNotuleren_schrijver" ;
        sign:externalUserId "733bc851-5793-4239-acd3-a63c8fc64de5";
        dct:subject <http://data.lblod.info/resources/besluiten/${id}> ;
        sign:secret "b994192c-7d2a-4f93-a8e8-2852b81e5e89" ;
        sign:status
  <http://mu.semte.ch/vocabularies/ext/signing/publication-status/unpublished> .
  }
}`;

export const updateQuery = (
  id,
  status
) => `PREFIX sign: <http://mu.semte.ch/vocabularies/ext/signing/>
DELETE {
    GRAPH ?g {
      <${id}> sign:status ?status .
    }
  } INSERT {
    GRAPH ?g {
      <${id}> sign:status <http://mu.semte.ch/vocabularies/ext/signing/publication-status/${status}> .
    }
  } WHERE {
    GRAPH ?g {
      <${id}> sign:status ?status .
    }
  }`;
