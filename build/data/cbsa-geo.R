library(tidyverse)
library(sf)
library(jsonlite)

#geo (shp) data
cbsa_shp <- "http://www2.census.gov/geo/tiger/GENZ2017/shp/cb_2017_us_cbsa_5m.zip"

download.file(cbsa_shp, "/home/alec/Projects/Brookings/black-devaluation/build/data/cbsa_shp.zip")

unzip("/home/alec/Projects/Brookings/black-devaluation/build/data/cbsa_shp.zip", exdir="/home/alec/Projects/Brookings/black-devaluation/build/data/cbsa_shp")

file.remove("/home/alec/Projects/Brookings/black-devaluation/build/data/cbsa_shp.zip")

cbsa0 <- st_read("/home/alec/Projects/Brookings/black-devaluation/build/data/cbsa_shp", "cb_2017_us_cbsa_5m")

cbsaxy <- st_centroid(cbsa0)
cbsaxy$lon <- st_coordinates(cbsaxy$geometry)[,"X"]
cbsaxy$lat <- st_coordinates(cbsaxy$geometry)[,"Y"]


cbsafinal <- cbsaxy %>% select(cbsa=CBSAFP, name=NAME, lon, lat) %>% arrange(cbsa)
class(cbsafinal)
st_geometry(cbsafinal) <- NULL

writeLines(c("var cbsa_geos = ", toJSON(cbsafinal, digits=5), ";", "export default cbsa_geos;"), "/home/alec/Projects/Brookings/black-devaluation/build/js/cbsa-geos.js")


#tests/checks
textxy <- strsplit(gsub("(^.*\\()|\\)", "", st_as_text(cbsaxy$geometry, digits=7))," ") %>% 
            lapply(function(r){return(data.frame(X=as.numeric(r[1]), Y=as.numeric(r[2])))}) %>% 
            do.call("rbind", .)

max(abs(textxy$X - cbsaxy$lon))
min(abs(textxy$Y - cbsaxy$lat))

sum(cbsaxy$CBSAFP==cbsaxy$GEOID) == nrow(cbsaxy)
