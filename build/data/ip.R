library(tidyverse)
library(jsonlite)

summary <- read_csv("/home/alec/Projects/Brookings/black-devaluation/build/data/Main_Summary_Data_Devaluation_by_MSA.csv")
neighborhood <- read_csv("/home/alec/Projects/Brookings/black-devaluation/build/data/Web_Assets_by_Neighborhood_Exposure.csv")

unik <- unique(summary$cbsa) %>% sort()
unikB <- unique(neighborhood$CBSA) %>% sort()

expo <- tibble(exposure=c("Less1", "B1_5", "B5_10", "B10_20", "B20_50", "Major"))

ones <- neighborhood %>% group_by(CBSA, CBSANAME) %>% summarise(n=n())

all <- lapply(unik, function(code){
  
  d <- summary %>% filter(cbsa==code) %>% as.data.frame()

  dd_ <- neighborhood %>% filter(CBSA==code) %>% full_join(expo, ., by="exposure") %>% as.data.frame() 
  
  nobs <- paste0("Metro summary obs: ", nrow(d), " | Neighborhood obs: ", nrow(dd_), "\n")
  if(nrow(d) != 1 || nrow(dd_) != 6){
    cat(nobs)
  }
  
  dd <- dd_ %>% split(.$exposure) %>% lapply(function(row){
    return(unbox(row))
  })
  
  return(list(summary=unbox(d), neighborhood=dd))
})

json <- toJSON(all, na="null", digits=5, pretty=TRUE)

writeLines(c("var all_data = ", json, ";", "export default all_data;", ""), con="/home/alec/Projects/Brookings/black-devaluation/build/js/all-data.js")
