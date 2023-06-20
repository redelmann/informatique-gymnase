{-# LANGUAGE OverloadedStrings, TupleSections, FlexibleContexts, ScopedTypeVariables #-}


import Hakyll
import Control.Monad (void, (>>=), liftM)
import Control.Applicative (empty)
import Data.Char (isAlphaNum, toLower)
import Data.Ord (comparing)
import Data.List (sortOn, sortBy, intercalate, elemIndex, isPrefixOf)
import Data.Maybe (fromMaybe, fromJust)
import Text.Read (readMaybe)
import Data.Foldable (toList)
import System.FilePath (takeDirectory, splitDirectories, joinPath)
import qualified Data.Text as T
import Data.Text.ICU.Char
import Data.Text.ICU.Normalize
import System.Process (readProcess)
import qualified Network.URI.Encode as URI

order :: Identifier -> Compiler Int
order ident = do 
    orderStr <- getMetadataField ident "order"
    return (fromMaybe 0 $ orderStr >>= readMaybe)

loadAllSorted :: Pattern -> Compiler [Item String]
loadAllSorted pattern = do
    items <- loadAll pattern
    byOrder itemIdentifier items

loadAllMetadataSorted :: Pattern -> Compiler [Item String]
loadAllMetadataSorted pattern = do
    identifiers <- getMatches pattern
    let items = [Item identifier "" | identifier <- identifiers]
    byOrder itemIdentifier items

getAllSorted :: Pattern -> Compiler [Identifier]
getAllSorted pattern = do
    items <- getMatches pattern
    byOrder id items

byOrder :: (a -> Identifier) -> [a] -> Compiler [a]
byOrder key = sortByM (order . key)
  where
    sortByM :: (Monad m, Ord k) => (a -> m k) -> [a] -> m [a]
    sortByM f xs = liftM (map fst . sortBy (comparing snd)) $
                   mapM (\x -> liftM (x,) (f x)) xs

canonicalForm :: String -> String
canonicalForm s = T.unpack noAccents
  where
    noAccents = T.filter (not . property Diacritic) normalizedText
    normalizedText = normalize NFD (T.pack s)

main :: IO ()
main = hakyll $ do
    match "css/**" $ do
        route idRoute
        compile compressCssCompiler
    
    match "js/**" $ do
        route idRoute
        compile copyFileCompiler

    match "assets/**" $ do
        route idRoute
        compile copyFileCompiler
    
    match "docs/**" $ do
        route idRoute
        compile copyFileCompiler
    
    match "images/**" $ do
        route $ customRoute $ \ ident ->
            let path = toFilePath ident
                dirs = splitDirectories path
            in joinPath $ case dirs of
                "images" : chapter : rest@(_ : _) -> chapter : "images" : rest
                "images" : filename : [] -> "images" : filename : []
                _ -> error $ "Unexpected path: " ++ path
        compile copyFileCompiler
    
    match "pages/**" $ do
        route $ gsubRoute "pages/" (const "")
        compile $ getResourceBody
            >>= applyAsTemplate (baseContext defaultContext)
            >>= loadAndApplyTemplate "templates/default.html" (baseContext defaultContext)
            >>= relativizeUrls

    match "chapters/*" $ do
        route $ gsubRoute "chapters/" (const "")
        compile $ getResourceBody
            >>= applyAsTemplate (baseContext defaultContext)
            >>= loadAndApplyTemplate "templates/chapter.html" (chapterContext (baseContext defaultContext))
            >>= loadAndApplyTemplate "templates/default.html" (chapterContext (baseContext defaultContext))
            >>= relativizeUrls

    match "chapters/*/*" $ do
        route $ gsubRoute "chapters/" (const "")
        compile $ getResourceBody
            >>= applyAsTemplate (baseContext defaultContext)
            >>= loadAndApplyTemplate "templates/section.html" (sectionContext (baseContext defaultContext))
            >>= loadAndApplyTemplate "templates/default.html" (sectionContext (baseContext defaultContext))
            >>= relativizeUrls

    match "index.html" $ do
        route idRoute
        compile $ do
            getResourceBody
                >>= applyAsTemplate (baseContext defaultContext)
                >>= loadAndApplyTemplate "templates/default.html" (baseContext defaultContext)
                >>= relativizeUrls

    match "templates/**" $ compile templateBodyCompiler


markupField :: String -> Context String
markupField name =
    field name startField <>
    field ("end" ++ name) endField
  where
    startField = mkField "start"
    endField = mkField "end"
    mkField kind page = do
        let ident = fromFilePath ("templates/" ++ name ++ "/" ++ kind ++ ".html")
        i <- loadAndApplyTemplate ident defaultContext page
        return $ itemBody i

baseContext :: Context String -> Context String
baseContext base =
    markupField "selfcheck" <>
    markupField "example" <>
    markupField "remark" <>
    markupField "tryout" <>
    markupField "objectives" <>
    markupField "codeplay" <>
    markupField "master" <>
    field "indexUrl" indexUrlField <>
    field "id" (return . toFilePath . itemIdentifier) <>
    functionField "youtube" youtubeFun <>
    field "globalNav" globalNavField <>
    field "lastModified" lastModifiedField <>
    field "globalLastModified" globalModifiedField <>
    field "compileTime" compileTimeField <>
    field "commit" commitField <>
    functionField "urlencode" urlencodeFun <>
    listField "chapters" (chapterContext base) (loadAllMetadataSorted "chapters/*") <>
    defaultContext <>
    base
  where
    exampleStartField page = do
        i <- loadAndApplyTemplate "templates/example/start.html" defaultContext page
        return $ itemBody i
    
    exampleEndField page = do
        i <- loadAndApplyTemplate "templates/example/end.html" defaultContext page
        return $ itemBody i

    indexUrlField page = do
        route <- getRoute "index.html"
        return $ fromJust route

    youtubeFun [arg] page = do
        let funContext = constField "videoid" arg <> defaultContext
        i <- loadAndApplyTemplate "templates/youtube.html" funContext page
        return $ itemBody i
    
    globalNavField page = do
        route <- getRoute $ itemIdentifier page
        let pathToRoot = toSiteRoot $ fromJust route
        let fieldContext = baseContext $
                            functionField "relativizeUrl" (\args _ -> case args of
                                [arg@('/' : _)] -> return $ pathToRoot ++ arg
                                [arg] -> return $ pathToRoot ++ "/" ++ arg
                                _ -> fail "relativizeUrl expects one argument") <>
                            field "active" (\item ->
                                if itemIdentifier item == itemIdentifier page
                                    then return "active"
                                    else fail "not active")
                            
        i <- loadAndApplyTemplate "templates/global-nav.html" fieldContext page
        return $ itemBody i
    
    lastModifiedField page = do
        recompilingUnsafeCompiler $ do
            str <- readProcess "git" [
                        "log",
                        "-1",
                        "--format=%cd",
                        "--date=format-local:%d.%m.%Y",
                        toFilePath $ itemIdentifier page
                    ] ""
            return $ trim str
    
    globalModifiedField page = do
        recompilingUnsafeCompiler $ do
            str <- readProcess "git" [
                        "log",
                        "-1",
                        "--format=%cd",
                        "--date=format-local:%d.%m.%Y"
                    ] ""
            return $ trim str
    
    compileTimeField page = do
        recompilingUnsafeCompiler $ do
            str <- readProcess "date" [
                        "+%d.%m.%Y %H:%M:%S"
                    ] ""
            return $ trim str

    commitField page = do
        recompilingUnsafeCompiler $ do
            str <- readProcess "git" [
                        "rev-parse",
                        "HEAD"
                    ] ""
            return $ trim str
    
    urlencodeFun [arg] page = do
        return $ URI.encode arg


chapterContext :: Context String -> Context String
chapterContext base =
    field "chapterNumber" chapterNumberField <>
    field "nextSectionUrl" nextSectionUrlField <>
    field "prevSectionUrl" prevSectionUrlField <>
    field "nextSectionTitle" nextSectionTitleField <>
    field "prevSectionTitle" prevSectionTitleField <>
    field "nextChapterUrl" nextChapterUrlField <>
    field "prevChapterUrl" prevChapterUrlField <>
    field "nextChapterTitle" nextChapterTitleField <>
    field "prevChapterTitle" prevChapterTitleField <>
    listFieldWith "sections" (sectionContext base) (computeSections . itemIdentifier) <>
    defaultContext <>
    base
  where
    chapterNumberField item = do
        let chapter = itemIdentifier item
        chapters <- getAllSorted "chapters/*"
        return $ show $ succ $ fromJust $ elemIndex chapter chapters

    firstSection item = do
        sections <- computeSections $ itemIdentifier item
        case sections of
            (section:_) -> return section
            _ -> fail "No sections"

    nextChapter item = do
        let chapter = itemIdentifier item
        chapters <- getAllSorted "chapters/*"
        case dropWhile (/= chapter) chapters of
            (_:next:_) -> return next
            _ -> fail "No next chapter"
    
    prevChapter item = do
        let chapter = itemIdentifier item
        chapters <- getAllSorted "chapters/*"
        case dropWhile (/= chapter) $ reverse chapters of
            (_:prev:_) -> return prev
            _ -> fail "No previous chapter"

    prevLastSection item = do
        prev <- prevChapter item
        sections <- computeSections prev
        case reverse sections of
            (section:_) -> return section
            _ -> fail "No previous chapter"

    nextSectionUrlField item = do
        section <- firstSection item
        route <- getRoute $ itemIdentifier section
        return $ fromJust route

    prevSectionUrlField item = do
        section <- prevLastSection item
        route <- getRoute $ itemIdentifier section
        return $ fromJust route

    nextSectionTitleField item = do
        section <- firstSection item
        metadata <- getMetadata $ itemIdentifier section
        return $ fromJust $ lookupString "title" metadata

    prevSectionTitleField item = do
        section <- prevLastSection item
        metadata <- getMetadata $ itemIdentifier section
        return $ fromJust $ lookupString "title" metadata
    
    prevUrlField item = do
        let identifier = itemIdentifier item
        chapterIdentifiers <- getAllSorted "chapters/*"
        let withPrevs = zip (tail chapterIdentifiers) chapterIdentifiers
        case filter ((== identifier) . fst) withPrevs of
            [] -> empty
            ((_, prev):_) -> do
                prevRoute <- getRoute prev
                return $ fromJust prevRoute
    
    nextChapterUrlField item = do
        next <- nextChapter item
        route <- getRoute next
        return $ fromJust route
    
    prevChapterUrlField item = do
        prev <- prevChapter item
        route <- getRoute prev
        return $ fromJust route
    
    nextChapterTitleField item = do
        next <- nextChapter item
        metadata <- getMetadata next
        return $ fromJust $ lookupString "title" metadata
    
    prevChapterTitleField item = do
        prev <- prevChapter item
        metadata <- getMetadata prev
        return $ fromJust $ lookupString "title" metadata

    computeSections pageId = do
        let directory = takeWhile (/= '.') $ toFilePath $ pageId
        loadAllMetadataSorted (fromGlob $ directory ++ "/*")

sectionContext :: Context String -> Context String
sectionContext base =
    field "chapterNumber" chapterNumField <>
    field "chapterUrl" chapterUrlField <>
    field "chapterTitle" chapterTitleField <>
    field "sectionNumber" sectionNumField <>
    field "nextSectionUrl" nextSectionUrlField <>
    field "prevSectionUrl" prevSectionUrlField <>
    field "nextSectionTitle" nextSectionTitleField <>
    field "prevSectionTitle" prevSectionTitleField <>
    field "nextChapterUrl" nextChapterUrlField <>
    field "prevChapterUrl" prevChapterUrlField <>
    field "nextChapterTitle" nextChapterTitleField <>
    field "prevChapterTitle" prevChapterTitleField <>
    defaultContext <>
    base
  where
    chapterOf item = do
        let sectionPath = toFilePath $ itemIdentifier item
        let chapterPath = takeDirectory sectionPath ++ ".html"
        return $ fromFilePath chapterPath

    chapterNumField item = do
        chapter <- chapterOf item
        chapters <- getAllSorted "chapters/*"
        return $ show $ succ $ fromJust $ elemIndex chapter chapters

    chapterUrlField item = do
        chapter <- chapterOf item
        route <- getRoute chapter
        return $ fromJust route
    
    chapterTitleField item = do
        chapter <- chapterOf item
        metadata <- getMetadata chapter
        return $ fromJust $ lookupString "title" metadata

    siblingSections item = do
        let section = itemIdentifier item
        let sectionsGlob = fromGlob $ takeDirectory (toFilePath section) ++ "/*"
        getAllSorted sectionsGlob

    sectionNumField item = do
        let section = itemIdentifier item
        sections <- siblingSections item
        return $ show $ succ $ fromJust $ elemIndex section sections

    nextSection item = do
        let section = itemIdentifier item
        sections <- siblingSections item
        let withNexts = zip sections (tail sections)
        case filter ((== section) . fst) withNexts of
            [] -> empty
            ((_, next):_) -> return next

    nextSectionUrlField item = do
        next <- nextSection item
        route <- getRoute next
        return $ fromJust route

    nextSectionTitleField item = do
        next <- nextSection item
        metadata <- getMetadata next
        return $ fromJust $ lookupString "title" metadata
    
    prevSection item = do
        let section = itemIdentifier item
        sections <- siblingSections item
        let withPrevs = zip (tail sections) sections
        case filter ((== section) . fst) withPrevs of
            [] -> empty
            ((_, prev):_) -> return prev

    prevSectionUrlField item = do
        prev <- prevSection item
        route <- getRoute prev
        return $ fromJust route
    
    prevSectionTitleField item = do
        prev <- prevSection item
        metadata <- getMetadata prev
        return $ fromJust $ lookupString "title" metadata

    nextChapter item = do
        chapter <- chapterOf item
        chapters <- getAllSorted "chapters/*"
        let withNexts = zip chapters (tail chapters)
        case filter ((== chapter) . fst) withNexts of
            [] -> empty
            ((_, next):_) -> return next
    
    nextChapterUrlField item = do
        next <- nextChapter item
        route <- getRoute next
        return $ fromJust route
    
    nextChapterTitleField item = do
        next <- nextChapter item
        metadata <- getMetadata next
        return $ fromJust $ lookupString "title" metadata
    
    prevChapter item = do
        chapter <- chapterOf item
        chapters <- getAllSorted "chapters/*"
        let withPrevs = zip (tail chapters) chapters
        case filter ((== chapter) . fst) withPrevs of
            [] -> empty
            ((_, prev):_) -> return prev
    
    prevChapterUrlField item = do
        prev <- prevChapter item
        route <- getRoute prev
        return $ fromJust route
    
    prevChapterTitleField item = do
        prev <- prevChapter item
        metadata <- getMetadata prev
        return $ fromJust $ lookupString "title" metadata


keepAlphaNum :: Char -> Char
keepAlphaNum x
    | isAlphaNum x = x
    | otherwise    = ' '

clean :: String -> String
clean = canonicalForm . map keepAlphaNum

slugify :: String -> String
slugify =
    intercalate "-" . words . map toLower . clean