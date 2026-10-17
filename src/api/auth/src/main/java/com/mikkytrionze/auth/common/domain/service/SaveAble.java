package com.mikkytrionze.auth.common.domain.service;

/**
 * Interface for classes that can have the save method.
 */
public interface SaveAble<T> {
    /**
     * Method to persist a model in database.
     * @param newObject is of type T, the object to persist.
     * @return saved object of type `T`.
     */
    T saveObject(T newObject);
}
